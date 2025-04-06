const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');
const Consultation = require('../models/Consultation');
const User = require('../models/User');
const { protect, authorize, verifiedOnly } = require('../middleware/auth');

/**
 * @route   GET /api/consultations/teachers
 * @desc    获取可咨询的教师列表
 * @access  Public
 */
router.get('/teachers', async (req, res) => {
    try {
        // 筛选条件
        let query = { role: 'teacher', isEmailVerified: true };

        // 根据学科筛选
        if (req.query.subject) {
            query['profile.subjects'] = req.query.subject;
        }

        // 分页设置
        const page = parseInt(req.query.page, 10) || 1;
        const limit = parseInt(req.query.limit, 10) || 10;
        const skip = (page - 1) * limit;

        // 查询教师，只返回必要字段
        const teachers = await User.find(query)
            .select('name avatar profile verification.status createdAt')
            .skip(skip)
            .limit(limit)
            .sort({ createdAt: -1 });

        // 获取总数
        const total = await User.countDocuments(query);

        res.json({
            success: true,
            count: teachers.length,
            total,
            page,
            pages: Math.ceil(total / limit),
            data: teachers
        });
    } catch (error) {
        console.error('获取教师列表错误:', error);
        res.status(500).json({
            success: false,
            message: '服务器错误',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

/**
 * @route   GET /api/consultations/teachers/:id
 * @desc    获取特定教师详情
 * @access  Public
 */
router.get('/teachers/:id', async (req, res) => {
    try {
        const teacher = await User.findOne({
            _id: req.params.id,
            role: 'teacher',
            isEmailVerified: true
        }).select('-password -resetPasswordToken -resetPasswordExpire -emailVerificationToken -emailVerificationExpire');

        if (!teacher) {
            return res.status(404).json({
                success: false,
                message: '未找到该教师'
            });
        }

        res.json({
            success: true,
            data: teacher
        });
    } catch (error) {
        console.error('获取教师详情错误:', error);
        res.status(500).json({
            success: false,
            message: '服务器错误',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

/**
 * @route   POST /api/consultations
 * @desc    创建咨询请求
 * @access  Private (学生)
 */
router.post('/', [
    protect,
    authorize('student'),
    verifiedOnly,
    [
        check('teacher', '请提供教师ID').not().isEmpty(),
        check('subject', '请提供咨询学科').not().isEmpty(),
        check('question', '请提供咨询问题').not().isEmpty(),
        check('scheduledTime', '请提供预约时间').optional().isISO8601()
    ]
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            errors: errors.array()
        });
    }

    try {
        const { teacher: teacherId, subject, question, scheduledTime } = req.body;

        // 验证教师是否存在
        const teacher = await User.findOne({
            _id: teacherId,
            role: 'teacher',
            isEmailVerified: true
        });

        if (!teacher) {
            return res.status(404).json({
                success: false,
                message: '未找到该教师'
            });
        }

        // 创建咨询请求
        const consultation = new Consultation({
            student: req.user.id,
            teacher: teacherId,
            subject,
            question,
            scheduledTime: scheduledTime || undefined
        });

        await consultation.save();

        // 可以添加通知教师的逻辑，如发送邮件或消息

        res.status(201).json({
            success: true,
            data: consultation
        });
    } catch (error) {
        console.error('创建咨询请求错误:', error);
        res.status(500).json({
            success: false,
            message: '服务器错误',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

/**
 * @route   GET /api/consultations
 * @desc    获取当前用户的咨询列表
 * @access  Private
 */
router.get('/', protect, async (req, res) => {
    try {
        const query = req.user.role === 'teacher'
            ? { teacher: req.user.id }
            : { student: req.user.id };

        // 分页设置
        const page = parseInt(req.query.page, 10) || 1;
        const limit = parseInt(req.query.limit, 10) || 10;
        const skip = (page - 1) * limit;

        // 状态筛选
        if (req.query.status && ['pending', 'accepted', 'rejected', 'completed', 'canceled'].includes(req.query.status)) {
            query.status = req.query.status;
        }

        const consultations = await Consultation.find(query)
            .populate('student', 'name avatar')
            .populate('teacher', 'name avatar profile.subjects')
            .skip(skip)
            .limit(limit)
            .sort({ createdAt: -1 });

        const total = await Consultation.countDocuments(query);

        res.json({
            success: true,
            count: consultations.length,
            total,
            page,
            pages: Math.ceil(total / limit),
            data: consultations
        });
    } catch (error) {
        console.error('获取咨询列表错误:', error);
        res.status(500).json({
            success: false,
            message: '服务器错误',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

/**
 * @route   GET /api/consultations/:id
 * @desc    获取特定咨询详情
 * @access  Private
 */
router.get('/:id', protect, async (req, res) => {
    try {
        const consultation = await Consultation.findById(req.params.id)
            .populate('student', 'name avatar profile')
            .populate('teacher', 'name avatar profile')
            .populate('messages.sender', 'name avatar role');

        if (!consultation) {
            return res.status(404).json({
                success: false,
                message: '未找到该咨询记录'
            });
        }

        // 验证查询用户是否是该咨询的参与者
        if (consultation.student._id.toString() !== req.user.id &&
            consultation.teacher._id.toString() !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: '无权访问此咨询记录'
            });
        }

        res.json({
            success: true,
            data: consultation
        });
    } catch (error) {
        console.error('获取咨询详情错误:', error);
        res.status(500).json({
            success: false,
            message: '服务器错误',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

/**
 * @route   PUT /api/consultations/:id/status
 * @desc    更新咨询状态（教师接受或拒绝）
 * @access  Private (教师)
 */
router.put('/:id/status', [
    protect,
    authorize('teacher'),
    [
        check('status', '请提供有效的状态').isIn(['accepted', 'rejected', 'completed'])
    ]
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            errors: errors.array()
        });
    }

    try {
        const { status } = req.body;

        let consultation = await Consultation.findById(req.params.id);

        if (!consultation) {
            return res.status(404).json({
                success: false,
                message: '未找到该咨询记录'
            });
        }

        // 验证是否是该咨询的教师
        if (consultation.teacher.toString() !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: '无权更新此咨询状态'
            });
        }

        // 验证状态更新是否合理
        if (consultation.status === 'canceled') {
            return res.status(400).json({
                success: false,
                message: '该咨询已被取消，无法更新状态'
            });
        }

        if (consultation.status === 'completed') {
            return res.status(400).json({
                success: false,
                message: '该咨询已完成，无法更新状态'
            });
        }

        // 更新状态
        consultation.status = status;
        await consultation.save();

        // 可以添加通知学生的逻辑，如发送邮件或消息

        res.json({
            success: true,
            data: consultation
        });
    } catch (error) {
        console.error('更新咨询状态错误:', error);
        res.status(500).json({
            success: false,
            message: '服务器错误',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

/**
 * @route   POST /api/consultations/:id/messages
 * @desc    发送咨询消息
 * @access  Private
 */
router.post('/:id/messages', [
    protect,
    [
        check('content', '消息内容不能为空').not().isEmpty()
    ]
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            errors: errors.array()
        });
    }

    try {
        const { content } = req.body;

        let consultation = await Consultation.findById(req.params.id);

        if (!consultation) {
            return res.status(404).json({
                success: false,
                message: '未找到该咨询记录'
            });
        }

        // 验证是否是该咨询的参与者
        if (consultation.student.toString() !== req.user.id &&
            consultation.teacher.toString() !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: '无权在此咨询中发送消息'
            });
        }

        // 验证咨询状态是否允许发送消息
        if (consultation.status !== 'accepted') {
            return res.status(400).json({
                success: false,
                message: `咨询状态为"${consultation.status}"，无法发送消息`
            });
        }

        // 添加消息
        consultation.messages.push({
            sender: req.user.id,
            content
        });

        await consultation.save();

        // 在实际应用中，这里应该通过WebSocket通知对方有新消息

        res.status(201).json({
            success: true,
            data: consultation.messages[consultation.messages.length - 1]
        });
    } catch (error) {
        console.error('发送咨询消息错误:', error);
        res.status(500).json({
            success: false,
            message: '服务器错误',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

/**
 * @route   POST /api/consultations/:id/feedback
 * @desc    提交咨询反馈
 * @access  Private (学生)
 */
router.post('/:id/feedback', [
    protect,
    authorize('student'),
    [
        check('rating', '请提供1-5之间的评分').isInt({ min: 1, max: 5 }),
        check('comment', '评论内容不能为空').optional()
    ]
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            errors: errors.array()
        });
    }

    try {
        const { rating, comment } = req.body;

        let consultation = await Consultation.findById(req.params.id);

        if (!consultation) {
            return res.status(404).json({
                success: false,
                message: '未找到该咨询记录'
            });
        }

        // 验证是否是该咨询的学生
        if (consultation.student.toString() !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: '只有学生可以提交反馈'
            });
        }

        // 验证咨询是否已完成
        if (consultation.status !== 'completed') {
            return res.status(400).json({
                success: false,
                message: '只能对已完成的咨询提交反馈'
            });
        }

        // 添加反馈
        consultation.feedback = {
            rating,
            comment,
            createdAt: Date.now()
        };

        await consultation.save();

        res.json({
            success: true,
            data: consultation
        });
    } catch (error) {
        console.error('提交咨询反馈错误:', error);
        res.status(500).json({
            success: false,
            message: '服务器错误',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

/**
 * @route   DELETE /api/consultations/:id
 * @desc    取消咨询请求
 * @access  Private (学生)
 */
router.delete('/:id', [
    protect,
    authorize('student')
], async (req, res) => {
    try {
        const consultation = await Consultation.findById(req.params.id);

        if (!consultation) {
            return res.status(404).json({
                success: false,
                message: '未找到该咨询记录'
            });
        }

        // 验证是否是该咨询的学生
        if (consultation.student.toString() !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: '无权取消此咨询'
            });
        }

        // 只能取消待处理的咨询
        if (consultation.status !== 'pending') {
            return res.status(400).json({
                success: false,
                message: `咨询状态为"${consultation.status}"，无法取消`
            });
        }

        // 更新状态为已取消
        consultation.status = 'canceled';
        await consultation.save();

        res.json({
            success: true,
            data: {},
            message: '咨询已取消'
        });
    } catch (error) {
        console.error('取消咨询错误:', error);
        res.status(500).json({
            success: false,
            message: '服务器错误',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

module.exports = router; 