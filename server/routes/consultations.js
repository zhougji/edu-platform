const express = require('express');
const router = express.Router();
const Consultation = require('../models/Consultation');
const ConsultationMessage = require('../models/ConsultationMessage');
const jwt = require('jsonwebtoken');

// JWT 认证中间件
const JWT_SECRET = 'education-resource-distribution-platform-secret';
const authenticateJWT = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (authHeader) {
        const token = authHeader.split(' ')[1];
        jwt.verify(token, JWT_SECRET, (err, user) => {
            if (err) {
                return res.status(403).json({ message: '认证失败，请重新登录' });
            }
            req.user = user;
            next();
        });
    } else {
        res.status(401).json({ message: '未授权，请登录' });
    }
};

// 获取学生的咨询历史
router.get('/', async (req, res) => {
    try {
        const { userId } = req.query;
        if (!userId) {
            return res.status(400).json({ message: '缺少用户ID' });
        }

        const consultations = await Consultation.find({ userId }).sort({ date: -1 });
        res.json(consultations);
    } catch (error) {
        console.error('获取咨询历史失败:', error);
        res.status(500).json({ message: '服务器错误' });
    }
});

// 获取特定咨询的详情
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const consultation = await Consultation.findById(id);

        if (!consultation) {
            return res.status(404).json({ message: '咨询不存在' });
        }

        // 获取相关消息
        const messages = await ConsultationMessage.find({ consultationId: id }).sort('time');

        const consultationWithMessages = {
            ...consultation.toObject(),
            messages: messages
        };

        res.json(consultationWithMessages);
    } catch (error) {
        console.error('获取咨询详情失败:', error);
        res.status(500).json({ message: '服务器错误' });
    }
});

// 学生创建新咨询请求
router.post('/', async (req, res) => {
    try {
        const { userId, subject, question, urgency, date, status } = req.body;

        // 从数据库获取学生信息
        const Student = require('../models/Student');
        const student = await Student.findById(userId);

        if (!student) {
            return res.status(404).json({ message: '学生不存在' });
        }

        const newConsultation = new Consultation({
            userId,
            studentName: student.name,
            studentGrade: student.grade,
            subject,
            question,
            urgency,
            date,
            status
        });

        await newConsultation.save();

        // 发送 WebSocket 通知给潜在的老师
        const io = req.app.get('io');
        if (io) {
            io.emit('new-consultation-request', {
                id: newConsultation._id,
                studentName: student.name,
                subject,
                urgency
            });
        }

        res.status(201).json(newConsultation);
    } catch (error) {
        console.error('创建咨询失败:', error);
        res.status(500).json({ message: '服务器错误' });
    }
});

// 获取等待被接受的咨询请求（教师用）
router.get('/requests', authenticateJWT, async (req, res) => {
    try {
        // 可以根据教师学科筛选
        const { teacherId } = req.query;
        const Teacher = require('../models/Teacher');
        const teacher = await Teacher.findById(teacherId);

        if (!teacher) {
            return res.status(404).json({ message: '教师不存在' });
        }

        // 获取等待中的咨询，可以根据教师专业领域筛选
        let consultations = await Consultation.find({ status: '等待中' }).sort('-urgency date');

        res.json(consultations);
    } catch (error) {
        console.error('获取咨询请求失败:', error);
        res.status(500).json({ message: '服务器错误' });
    }
});

// 教师接受咨询请求
router.post('/:id/accept', authenticateJWT, async (req, res) => {
    try {
        const { id } = req.params;
        const { teacherId } = req.body;

        const consultation = await Consultation.findById(id);
        if (!consultation) {
            return res.status(404).json({ message: '咨询不存在' });
        }

        if (consultation.status !== '等待中') {
            return res.status(400).json({ message: '该咨询已被接受或已完成' });
        }

        // 获取教师信息
        const Teacher = require('../models/Teacher');
        const teacher = await Teacher.findById(teacherId);

        if (!teacher) {
            return res.status(404).json({ message: '教师不存在' });
        }

        // 更新咨询状态
        consultation.status = '已接受';
        consultation.teacherId = teacherId;
        consultation.teacherName = teacher.name;
        await consultation.save();

        // 发送 WebSocket 通知给学生
        const io = req.app.get('io');
        if (io) {
            io.emit('consultation-accepted', {
                id: consultation._id,
                teacherName: teacher.name,
                studentId: consultation.userId
            });
        }

        // 获取相关消息
        const messages = await ConsultationMessage.find({ consultationId: id }).sort('time');

        const consultationWithMessages = {
            ...consultation.toObject(),
            messages: messages
        };

        res.json(consultationWithMessages);
    } catch (error) {
        console.error('接受咨询失败:', error);
        res.status(500).json({ message: '服务器错误' });
    }
});

// 获取教师的活跃咨询
router.get('/active', authenticateJWT, async (req, res) => {
    try {
        const { teacherId } = req.query;

        const consultations = await Consultation.find({
            teacherId,
            status: '已接受'
        }).sort('date');

        // 为每个咨询添加消息
        const consultationsWithMessages = await Promise.all(
            consultations.map(async (consultation) => {
                const messages = await ConsultationMessage.find({
                    consultationId: consultation._id
                }).sort('time');

                return {
                    ...consultation.toObject(),
                    messages
                };
            })
        );

        res.json(consultationsWithMessages);
    } catch (error) {
        console.error('获取活跃咨询失败:', error);
        res.status(500).json({ message: '服务器错误' });
    }
});

// 完成咨询
router.post('/:id/complete', authenticateJWT, async (req, res) => {
    try {
        const { id } = req.params;

        const consultation = await Consultation.findById(id);
        if (!consultation) {
            return res.status(404).json({ message: '咨询不存在' });
        }

        if (consultation.status !== '已接受') {
            return res.status(400).json({ message: '该咨询尚未被接受或已经完成' });
        }

        // 更新状态
        consultation.status = '已完成';
        consultation.completedAt = new Date();
        await consultation.save();

        res.json(consultation);
    } catch (error) {
        console.error('完成咨询失败:', error);
        res.status(500).json({ message: '服务器错误' });
    }
});

// 添加咨询消息
router.post('/messages', async (req, res) => {
    try {
        const { consultationId, content, sender, time } = req.body;

        const consultation = await Consultation.findById(consultationId);
        if (!consultation) {
            return res.status(404).json({ message: '咨询不存在' });
        }

        const newMessage = new ConsultationMessage({
            consultationId,
            content,
            sender,
            time
        });

        await newMessage.save();

        // 发送 WebSocket 通知
        const io = req.app.get('io');
        if (io) {
            io.to(`consultation-${consultationId}`).emit('message', newMessage);
        }

        res.status(201).json(newMessage);
    } catch (error) {
        console.error('发送消息失败:', error);
        res.status(500).json({ message: '服务器错误' });
    }
});

module.exports = router; 