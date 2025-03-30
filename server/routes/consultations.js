const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');
const Consultation = require('../models/Consultation');
const User = require('../models/User');
const { protect, verifiedOnly, authorize } = require('../middleware/auth');

/**
 * @route   POST /api/consultations
 * @desc    创建新咨询请求
 * @access  Private (学生)
 */
router.post(
    '/',
    [
        protect,
        verifiedOnly,
        authorize('student'),
        [
            check('teacher', '请选择教师').not().isEmpty(),
            check('subject', '请提供咨询主题').not().isEmpty(),
            check('description', '请提供问题描述').not().isEmpty()
        ]
    ],
    async (req, res) => {
        // 验证输入
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                errors: errors.array()
            });
        }

        try {
            // 提取请求数据
            const {
                teacher,
                subject,
                description,
                scheduledTime,
                duration,
                isVideoEnabled
            } = req.body;

            // 确认教师存在且角色为教师
            const teacherExists = await User.findOne({
                _id: teacher,
                role: 'teacher'
            });

            if (!teacherExists) {
                return res.status(404).json({
                    success: false,
                    message: '找不到指定的教师'
                });
            }

            // 创建咨询记录
            const consultation = await Consultation.create({
                student: req.user._id,
                teacher,
                subject,
                description,
                scheduledTime: scheduledTime || undefined,
                duration: duration || 30,
                isVideoEnabled: isVideoEnabled !== undefined ? isVideoEnabled : true
            });

            // 返回新创建的咨询
            const populatedConsultation = await Consultation.findById(consultation._id)
                .populate('student', 'name avatar')
                .populate('teacher', 'name avatar profile');

            res.status(201).json({
                success: true,
                consultation: populatedConsultation,
                message: '咨询请求已发送，等待教师接受'
            });
        } catch (error) {
            console.error('创建咨询错误:', error);
            res.status(500).json({
                success: false,
                message: '服务器错误',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    }
);

/**
 * @route   GET /api/consultations
 * @desc    获取用户的咨询列表
 * @access  Private
 */
router.get('/', [protect, verifiedOnly], async (req, res) => {
    try {
        let query = {};

        // 根据用户角色过滤咨询
        if (req.user.role === 'student') {
            query.student = req.user._id;
        } else if (req.user.role === 'teacher') {
            query.teacher = req.user._id;
        } else if (req.user.role === 'admin') {
            // 管理员可以查看所有咨询
        } else {
            return res.status(403).json({
                success: false,
                message: '您没有权限访问咨询记录'
            });
        }

        // 查询参数
        const { status, limit = 10, page = 1 } = req.query;

        if (status) {
            query.status = status;
        }

        // 计算总数和分页
        const total = await Consultation.countDocuments(query);
        const consultations = await Consultation.find(query)
            .populate('student', 'name avatar')
            .populate('teacher', 'name avatar profile.subject')
            .sort({ createdAt: -1 })
            .skip((parseInt(page) - 1) * parseInt(limit))
            .limit(parseInt(limit));

        res.json({
            success: true,
            count: consultations.length,
            total,
            pages: Math.ceil(total / parseInt(limit)),
            page: parseInt(page),
            consultations
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
router.get('/:id', [protect, verifiedOnly], async (req, res) => {
    try {
        const consultation = await Consultation.findById(req.params.id)
            .populate('student', 'name avatar profile.grade')
            .populate('teacher', 'name avatar profile')
            .populate('messages.sender', 'name avatar role');

        if (!consultation) {
            return res.status(404).json({
                success: false,
                message: '找不到咨询记录'
            });
        }

        // 验证访问权限
        if (
            consultation.student._id.toString() !== req.user._id.toString() &&
            consultation.teacher._id.toString() !== req.user._id.toString() &&
            req.user.role !== 'admin'
        ) {
            return res.status(403).json({
                success: false,
                message: '您没有权限查看此咨询记录'
            });
        }

        // 标记当前用户的未读消息为已读
        await consultation.markAllAsRead(req.user._id);

        res.json({
            success: true,
            consultation
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
 * @route   PUT /api/consultations/:id/accept
 * @desc    教师接受咨询请求
 * @access  Private (教师)
 */
router.put(
    '/:id/accept',
    [protect, verifiedOnly, authorize('teacher')],
    async (req, res) => {
        try {
            const consultation = await Consultation.findById(req.params.id);

            if (!consultation) {
                return res.status(404).json({
                    success: false,
                    message: '找不到咨询记录'
                });
            }

            // 验证是否为指定的教师
            if (consultation.teacher.toString() !== req.user._id.toString()) {
                return res.status(403).json({
                    success: false,
                    message: '您不是此咨询的指定教师'
                });
            }

            // 验证咨询是否可以接受
            if (consultation.status !== 'pending') {
                return res.status(400).json({
                    success: false,
                    message: `无法接受处于 ${consultation.status} 状态的咨询`
                });
            }

            // 更新咨询状态
            consultation.status = 'accepted';
            await consultation.save();

            // 返回更新后的咨询
            const updatedConsultation = await Consultation.findById(req.params.id)
                .populate('student', 'name avatar')
                .populate('teacher', 'name avatar');

            res.json({
                success: true,
                consultation: updatedConsultation,
                message: '咨询已接受'
            });
        } catch (error) {
            console.error('接受咨询错误:', error);
            res.status(500).json({
                success: false,
                message: '服务器错误',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    }
);

/**
 * @route   PUT /api/consultations/:id/start
 * @desc    开始咨询会话
 * @access  Private (教师)
 */
router.put(
    '/:id/start',
    [protect, verifiedOnly, authorize('teacher')],
    async (req, res) => {
        try {
            const consultation = await Consultation.findById(req.params.id);

            if (!consultation) {
                return res.status(404).json({
                    success: false,
                    message: '找不到咨询记录'
                });
            }

            // 验证是否为指定的教师
            if (consultation.teacher.toString() !== req.user._id.toString()) {
                return res.status(403).json({
                    success: false,
                    message: '您不是此咨询的指定教师'
                });
            }

            // 验证咨询是否可以开始
            if (consultation.status !== 'accepted') {
                return res.status(400).json({
                    success: false,
                    message: `无法开始处于 ${consultation.status} 状态的咨询`
                });
            }

            // 生成视频会话ID (如果启用视频)
            if (consultation.isVideoEnabled) {
                // 使用时间戳和会话ID生成唯一视频会话ID
                consultation.sessionId = `${Date.now()}-${consultation._id}`;
            }

            // 更新咨询状态
            consultation.status = 'ongoing';
            consultation.startTime = Date.now();
            await consultation.save();

            // 返回更新后的咨询
            const updatedConsultation = await Consultation.findById(req.params.id)
                .populate('student', 'name avatar')
                .populate('teacher', 'name avatar');

            res.json({
                success: true,
                consultation: updatedConsultation,
                message: '咨询已开始'
            });
        } catch (error) {
            console.error('开始咨询错误:', error);
            res.status(500).json({
                success: false,
                message: '服务器错误',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    }
);

/**
 * @route   PUT /api/consultations/:id/complete
 * @desc    结束咨询会话
 * @access  Private (教师)
 */
router.put(
    '/:id/complete',
    [protect, verifiedOnly, authorize('teacher')],
    async (req, res) => {
        try {
            const consultation = await Consultation.findById(req.params.id);

            if (!consultation) {
                return res.status(404).json({
                    success: false,
                    message: '找不到咨询记录'
                });
            }

            // 验证是否为指定的教师
            if (consultation.teacher.toString() !== req.user._id.toString()) {
                return res.status(403).json({
                    success: false,
                    message: '您不是此咨询的指定教师'
                });
            }

            // 验证咨询是否可以结束
            if (consultation.status !== 'ongoing') {
                return res.status(400).json({
                    success: false,
                    message: `无法结束处于 ${consultation.status} 状态的咨询`
                });
            }

            // 更新咨询状态
            consultation.status = 'completed';
            consultation.endTime = Date.now();
            await consultation.save();

            // 返回更新后的咨询
            const updatedConsultation = await Consultation.findById(req.params.id)
                .populate('student', 'name avatar')
                .populate('teacher', 'name avatar');

            res.json({
                success: true,
                consultation: updatedConsultation,
                message: '咨询已完成'
            });
        } catch (error) {
            console.error('结束咨询错误:', error);
            res.status(500).json({
                success: false,
                message: '服务器错误',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    }
);

/**
 * @route   PUT /api/consultations/:id/cancel
 * @desc    取消咨询请求
 * @access  Private (学生/教师/管理员)
 */
router.put('/:id/cancel', [protect, verifiedOnly], async (req, res) => {
    try {
        const consultation = await Consultation.findById(req.params.id);

        if (!consultation) {
            return res.status(404).json({
                success: false,
                message: '找不到咨询记录'
            });
        }

        // 验证权限
        const isStudent = consultation.student.toString() === req.user._id.toString();
        const isTeacher = consultation.teacher.toString() === req.user._id.toString();
        const isAdmin = req.user.role === 'admin';

        if (!isStudent && !isTeacher && !isAdmin) {
            return res.status(403).json({
                success: false,
                message: '您没有权限取消此咨询'
            });
        }

        // 验证咨询是否可以取消
        if (consultation.status === 'completed' || consultation.status === 'cancelled') {
            return res.status(400).json({
                success: false,
                message: `无法取消处于 ${consultation.status} 状态的咨询`
            });
        }

        // 更新咨询状态
        consultation.status = 'cancelled';
        await consultation.save();

        // 返回更新后的咨询
        const updatedConsultation = await Consultation.findById(req.params.id)
            .populate('student', 'name avatar')
            .populate('teacher', 'name avatar');

        res.json({
            success: true,
            consultation: updatedConsultation,
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

/**
 * @route   POST /api/consultations/:id/messages
 * @desc    发送咨询消息
 * @access  Private (学生/教师)
 */
router.post(
    '/:id/messages',
    [
        protect,
        verifiedOnly,
        check('text', '消息内容不能为空').not().isEmpty()
    ],
    async (req, res) => {
        // 验证输入
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                errors: errors.array()
            });
        }

        try {
            const consultation = await Consultation.findById(req.params.id);

            if (!consultation) {
                return res.status(404).json({
                    success: false,
                    message: '找不到咨询记录'
                });
            }

            // 验证权限
            const isStudent = consultation.student.toString() === req.user._id.toString();
            const isTeacher = consultation.teacher.toString() === req.user._id.toString();

            if (!isStudent && !isTeacher) {
                return res.status(403).json({
                    success: false,
                    message: '您没有权限在此咨询中发送消息'
                });
            }

            // 验证咨询状态
            if (consultation.status === 'cancelled' || consultation.status === 'completed') {
                return res.status(400).json({
                    success: false,
                    message: `无法在处于 ${consultation.status} 状态的咨询中发送消息`
                });
            }

            // 添加新消息
            const newMessage = {
                sender: req.user._id,
                text: req.body.text,
                timestamp: Date.now()
            };

            consultation.messages.push(newMessage);
            await consultation.save();

            // 返回填充了发送者信息的消息
            const updatedConsultation = await Consultation.findById(req.params.id)
                .populate('messages.sender', 'name avatar role');

            const addedMessage = updatedConsultation.messages[updatedConsultation.messages.length - 1];

            res.status(201).json({
                success: true,
                message: addedMessage,
                consultationId: consultation._id
            });
        } catch (error) {
            console.error('发送咨询消息错误:', error);
            res.status(500).json({
                success: false,
                message: '服务器错误',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    }
);

/**
 * @route   POST /api/consultations/:id/rate
 * @desc    对已完成的咨询进行评分
 * @access  Private (学生)
 */
router.post(
    '/:id/rate',
    [
        protect,
        verifiedOnly,
        authorize('student'),
        [
            check('rating', '评分必须是1-5之间的数字').isInt({ min: 1, max: 5 }),
            check('feedback', '反馈内容是必需的').not().isEmpty()
        ]
    ],
    async (req, res) => {
        // 验证输入
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                errors: errors.array()
            });
        }

        try {
            const consultation = await Consultation.findById(req.params.id);

            if (!consultation) {
                return res.status(404).json({
                    success: false,
                    message: '找不到咨询记录'
                });
            }

            // 验证权限
            if (consultation.student.toString() !== req.user._id.toString()) {
                return res.status(403).json({
                    success: false,
                    message: '您不是此咨询的学生'
                });
            }

            // 验证咨询是否已完成
            if (consultation.status !== 'completed') {
                return res.status(400).json({
                    success: false,
                    message: '只能对已完成的咨询进行评分'
                });
            }

            // 更新评分和反馈
            const { rating, feedback } = req.body;
            consultation.rating = rating;
            consultation.feedback = feedback;
            await consultation.save();

            res.json({
                success: true,
                message: '评分提交成功',
                rating: consultation.rating,
                feedback: consultation.feedback
            });
        } catch (error) {
            console.error('咨询评分错误:', error);
            res.status(500).json({
                success: false,
                message: '服务器错误',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    }
);

module.exports = router; 