const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { check, validationResult } = require('express-validator');
const User = require('../models/User');
const { generateToken, protect } = require('../middleware/auth');
const { sendVerificationEmail, sendPasswordResetEmail } = require('../utils/sendEmail');
const config = require('../config/config');
const { sendVerificationCode } = require('../utils/notification');

/**
 * @route   POST /api/auth/register
 * @desc    注册新用户
 * @access  Public
 */
router.post(
    '/register',
    [
        check('name', '姓名是必需的').not().isEmpty(),
        check('email', '请提供有效的电子邮件').isEmail(),
        check('password', '密码至少需要6个字符').isLength({ min: 6 }),
        check('role', '角色类型无效').isIn(['student', 'teacher'])
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

        const { name, email, password, role, profile } = req.body;

        try {
            // 检查邮箱是否已被注册
            let user = await User.findOne({ email: email.toLowerCase() });

            if (user) {
                return res.status(400).json({
                    success: false,
                    message: '此邮箱已被注册'
                });
            }

            // 创建新用户
            user = new User({
                name,
                email: email.toLowerCase(),
                password,
                role: role || 'student',
                profile: profile || {}
            });

            // 生成邮箱验证令牌
            const verificationToken = user.generateEmailVerificationToken();

            // 保存用户
            await user.save();

            // 发送验证邮件
            const clientURL = process.env.CLIENT_URL || 'http://localhost:8080';
            await sendVerificationEmail(user.email, user.name, verificationToken, clientURL);

            // 生成JWT
            const token = generateToken(user._id);

            res.status(201).json({
                success: true,
                token,
                user: {
                    id: user._id,
                    name: user.name,
                    email: user.email,
                    role: user.role,
                    avatar: user.avatar,
                    isEmailVerified: user.isEmailVerified
                },
                message: '注册成功，请查收邮箱并完成验证'
            });
        } catch (error) {
            console.error('注册错误:', error);
            res.status(500).json({
                success: false,
                message: '服务器错误',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    }
);

/**
 * @route   POST /api/auth/login
 * @desc    用户登录并返回JWT
 * @access  Public
 */
router.post(
    '/login',
    [
        check('email', '请提供有效的电子邮件').isEmail(),
        check('password', '密码是必需的').exists()
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

        const { email, password } = req.body;

        try {
            // 查找用户并包含密码字段
            const user = await User.findOne({ email: email.toLowerCase() }).select('+password');

            if (!user) {
                return res.status(401).json({
                    success: false,
                    message: '无效的凭据'
                });
            }

            // 验证密码
            const isMatch = await user.matchPassword(password);

            if (!isMatch) {
                return res.status(401).json({
                    success: false,
                    message: '无效的凭据'
                });
            }

            // 更新最后活动时间
            user.lastActive = Date.now();
            await user.save({ validateBeforeSave: false });

            // 生成JWT
            const token = generateToken(user._id);

            res.json({
                success: true,
                token,
                user: {
                    id: user._id,
                    name: user.name,
                    email: user.email,
                    role: user.role,
                    avatar: user.avatar,
                    isEmailVerified: user.isEmailVerified
                }
            });
        } catch (error) {
            console.error('登录错误:', error);
            res.status(500).json({
                success: false,
                message: '服务器错误',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    }
);

/**
 * @route   GET /api/auth/me
 * @desc    获取当前用户信息
 * @access  Private
 */
router.get('/me', protect, async (req, res) => {
    try {
        // req.user 已由认证中间件设置
        const user = await User.findById(req.user._id);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: '用户未找到'
            });
        }

        res.json({
            success: true,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                avatar: user.avatar,
                isEmailVerified: user.isEmailVerified,
                profile: user.profile,
                createdAt: user.createdAt,
                lastActive: user.lastActive
            }
        });
    } catch (error) {
        console.error('获取用户信息错误:', error);
        res.status(500).json({
            success: false,
            message: '服务器错误',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

/**
 * @route   GET /api/auth/verify-email/:token
 * @desc    验证用户邮箱
 * @access  Public
 */
router.get('/verify-email/:token', async (req, res) => {
    try {
        // 获取验证令牌并进行哈希
        const emailVerificationToken = crypto
            .createHash('sha256')
            .update(req.params.token)
            .digest('hex');

        // 查找符合条件的用户
        const user = await User.findOne({
            emailVerificationToken,
            emailVerificationExpire: { $gt: Date.now() }
        });

        if (!user) {
            return res.status(400).json({
                success: false,
                message: '无效或过期的验证令牌'
            });
        }

        // 更新用户状态
        user.isEmailVerified = true;
        user.emailVerificationToken = undefined;
        user.emailVerificationExpire = undefined;

        await user.save();

        res.json({
            success: true,
            message: '邮箱验证成功，您现在可以登录了'
        });
    } catch (error) {
        console.error('邮箱验证错误:', error);
        res.status(500).json({
            success: false,
            message: '服务器错误',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

/**
 * @route   POST /api/auth/resend-verification
 * @desc    重新发送验证邮件
 * @access  Private
 */
router.post('/resend-verification', protect, async (req, res) => {
    try {
        const user = req.user;

        if (user.isEmailVerified) {
            return res.status(400).json({
                success: false,
                message: '此邮箱已经验证过了'
            });
        }

        // 生成新的验证令牌
        const verificationToken = user.generateEmailVerificationToken();
        await user.save();

        // 发送验证邮件
        const clientURL = process.env.CLIENT_URL || 'http://localhost:8080';
        await sendVerificationEmail(user.email, user.name, verificationToken, clientURL);

        res.json({
            success: true,
            message: '验证邮件已重新发送，请查收'
        });
    } catch (error) {
        console.error('重发验证邮件错误:', error);
        res.status(500).json({
            success: false,
            message: '服务器错误',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

/**
 * @route   POST /api/auth/forgot-password
 * @desc    发送密码重置邮件
 * @access  Public
 */
router.post(
    '/forgot-password',
    [check('email', '请提供有效的电子邮件').isEmail()],
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
            const user = await User.findOne({ email: req.body.email.toLowerCase() });

            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: '没有与此邮箱关联的用户'
                });
            }

            // 生成重置令牌
            const resetToken = user.generateResetPasswordToken();
            await user.save();

            // 发送重置邮件
            const clientURL = process.env.CLIENT_URL || 'http://localhost:8080';
            await sendPasswordResetEmail(user.email, user.name, resetToken, clientURL);

            res.json({
                success: true,
                message: '密码重置邮件已发送'
            });
        } catch (error) {
            console.error('忘记密码错误:', error);
            res.status(500).json({
                success: false,
                message: '服务器错误',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    }
);

/**
 * @route   PUT /api/auth/reset-password/:token
 * @desc    重置密码
 * @access  Public
 */
router.put(
    '/reset-password/:token',
    [check('password', '密码至少需要6个字符').isLength({ min: 6 })],
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
            // 获取重置令牌并进行哈希
            const resetPasswordToken = crypto
                .createHash('sha256')
                .update(req.params.token)
                .digest('hex');

            // 查找符合条件的用户
            const user = await User.findOne({
                resetPasswordToken,
                resetPasswordExpire: { $gt: Date.now() }
            });

            if (!user) {
                return res.status(400).json({
                    success: false,
                    message: '无效或过期的重置令牌'
                });
            }

            // 设置新密码
            user.password = req.body.password;
            user.resetPasswordToken = undefined;
            user.resetPasswordExpire = undefined;

            await user.save();

            res.json({
                success: true,
                message: '密码重置成功，您现在可以使用新密码登录'
            });
        } catch (error) {
            console.error('重置密码错误:', error);
            res.status(500).json({
                success: false,
                message: '服务器错误',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    }
);

/**
 * @route   PUT /api/auth/update-profile
 * @desc    更新用户资料
 * @access  Private
 */
router.put(
    '/update-profile',
    protect,
    [check('name', '姓名是必需的').not().isEmpty()],
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
            const { name, avatar, profile } = req.body;
            const updateData = {
                name,
                avatar: avatar || req.user.avatar
            };

            if (profile) {
                updateData.profile = {
                    ...req.user.profile,
                    ...profile
                };
            }

            const user = await User.findByIdAndUpdate(
                req.user._id,
                updateData,
                { new: true, runValidators: true }
            );

            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: '用户未找到'
                });
            }

            res.json({
                success: true,
                user: {
                    id: user._id,
                    name: user.name,
                    email: user.email,
                    role: user.role,
                    avatar: user.avatar,
                    isEmailVerified: user.isEmailVerified,
                    profile: user.profile
                },
                message: '个人资料更新成功'
            });
        } catch (error) {
            console.error('更新资料错误:', error);
            res.status(500).json({
                success: false,
                message: '服务器错误',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    }
);

/**
 * @route   PUT /api/auth/change-password
 * @desc    修改密码
 * @access  Private
 */
router.put(
    '/change-password',
    protect,
    [
        check('currentPassword', '当前密码是必需的').exists(),
        check('newPassword', '新密码至少需要6个字符').isLength({ min: 6 })
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
            // 获取包含密码的用户
            const user = await User.findById(req.user._id).select('+password');

            // 验证当前密码
            const isMatch = await user.matchPassword(req.body.currentPassword);

            if (!isMatch) {
                return res.status(401).json({
                    success: false,
                    message: '当前密码不正确'
                });
            }

            // 设置新密码
            user.password = req.body.newPassword;
            await user.save();

            res.json({
                success: true,
                message: '密码修改成功'
            });
        } catch (error) {
            console.error('修改密码错误:', error);
            res.status(500).json({
                success: false,
                message: '服务器错误',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    }
);

// 生成验证码
const generateVerificationCode = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};

// 发送验证码（手机或邮箱）
router.post('/sendVerificationCode', async (req, res) => {
    try {
        const { contactType, contact } = req.body;

        if (!contactType || !contact) {
            return res.status(400).send({ error: '请提供联系方式类型和联系方式' });
        }

        // 检查联系方式是否已被注册
        const existingUser = await User.findOne({
            [`${contactType}`]: contact
        });

        // 生成验证码
        const verificationCode = generateVerificationCode();

        // 存储验证码（此处应该使用Redis等缓存，为简化示例使用内存存储）
        // 实际项目中应该使用Redis并设置过期时间
        global.verificationCodes = global.verificationCodes || {};
        global.verificationCodes[contact] = {
            code: verificationCode,
            expires: Date.now() + 10 * 60 * 1000 // 10分钟过期
        };

        // 发送验证码
        await sendVerificationCode(contactType, contact, verificationCode);

        res.status(200).send({ message: '验证码已发送' });
    } catch (error) {
        res.status(500).send({ error: '发送验证码失败' });
    }
});

// 用户注册
router.post('/register', async (req, res) => {
    try {
        const { name, contactType, contact, verificationCode, password, role } = req.body;

        // 验证必填字段
        if (!name || !contactType || !contact || !verificationCode || !password || !role) {
            return res.status(400).send({ error: '请提供所有必填信息' });
        }

        // 验证角色类型
        if (role !== 'student' && role !== 'teacher') {
            return res.status(400).send({ error: '角色类型无效' });
        }

        // 验证验证码
        const storedVerification = global.verificationCodes && global.verificationCodes[contact];
        if (!storedVerification ||
            storedVerification.code !== verificationCode ||
            storedVerification.expires < Date.now()) {
            return res.status(400).send({ error: '验证码无效或已过期' });
        }

        // 检查用户是否已存在
        const existingUser = await User.findOne({
            [`${contactType}`]: contact
        });

        if (existingUser) {
            return res.status(400).send({ error: '该联系方式已被注册' });
        }

        // 创建新用户
        const user = new User({
            name,
            [contactType]: contact,
            password,
            role,
            profile: {
                realName: name,
                // 其他字段会在用户完善资料时添加
            }
        });

        // 保存用户
        await user.save();

        // 生成JWT令牌
        const token = jwt.sign({ _id: user._id.toString() }, config.JWT_SECRET);
        user.tokens = user.tokens || [];
        user.tokens.push({ token });
        await user.save();

        // 清除验证码
        if (global.verificationCodes && global.verificationCodes[contact]) {
            delete global.verificationCodes[contact];
        }

        res.status(201).send({ user, token });
    } catch (error) {
        res.status(500).send({ error: '注册失败' });
    }
});

// 用户登录
router.post('/login', async (req, res) => {
    try {
        const { contactType, contact, password } = req.body;

        // 查找用户
        const user = await User.findOne({ [`${contactType}`]: contact });
        if (!user) {
            return res.status(401).send({ error: '登录失败，用户不存在' });
        }

        // 验证密码
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).send({ error: '登录失败，密码错误' });
        }

        // 生成JWT令牌
        const token = jwt.sign({ _id: user._id.toString() }, config.JWT_SECRET);
        user.tokens = user.tokens || [];
        user.tokens.push({ token });
        await user.save();

        res.send({ user, token });
    } catch (error) {
        res.status(500).send({ error: '登录失败' });
    }
});

// 验证码登录
router.post('/login/verification', async (req, res) => {
    try {
        const { contactType, contact, verificationCode } = req.body;

        // 验证验证码
        const storedVerification = global.verificationCodes && global.verificationCodes[contact];
        if (!storedVerification ||
            storedVerification.code !== verificationCode ||
            storedVerification.expires < Date.now()) {
            return res.status(400).send({ error: '验证码无效或已过期' });
        }

        // 查找用户
        let user = await User.findOne({ [`${contactType}`]: contact });

        // 如果用户不存在，返回错误（验证码登录要求用户已注册）
        if (!user) {
            return res.status(401).send({ error: '用户不存在，请先注册' });
        }

        // 生成JWT令牌
        const token = jwt.sign({ _id: user._id.toString() }, config.JWT_SECRET);
        user.tokens = user.tokens || [];
        user.tokens.push({ token });
        await user.save();

        // 清除验证码
        if (global.verificationCodes && global.verificationCodes[contact]) {
            delete global.verificationCodes[contact];
        }

        res.send({ user, token });
    } catch (error) {
        res.status(500).send({ error: '登录失败' });
    }
});

// 用户登出
router.post('/logout', protect, async (req, res) => {
    try {
        req.user.tokens = req.user.tokens.filter((token) => {
            return token.token !== req.token;
        });
        await req.user.save();
        res.send({ message: '登出成功' });
    } catch (error) {
        res.status(500).send({ error: '登出失败' });
    }
});

// 修改个人资料
router.patch('/profile', protect, async (req, res) => {
    const updates = req.body;
    const allowedUpdates = ['avatar', 'age', 'grade', 'subjects', 'bio', 'specialties'];

    try {
        // 过滤允许更新的字段
        const isValidOperation = Object.keys(updates).every((update) =>
            allowedUpdates.includes(update));

        if (!isValidOperation) {
            return res.status(400).send({ error: '无效的更新字段' });
        }

        // 更新用户资料
        Object.keys(updates).forEach((update) => {
            req.user.profile[update] = updates[update];
        });

        await req.user.save();
        res.send(req.user);
    } catch (error) {
        res.status(500).send({ error: '更新资料失败' });
    }
});

// 教师实名认证
router.post('/teacher/verify', protect, async (req, res) => {
    try {
        // 检查用户是否为教师
        if (req.user.role !== 'teacher') {
            return res.status(403).send({ error: '只有教师账号才能进行实名认证' });
        }

        const { realName, idNumber, teacherCertificate } = req.body;

        // 验证必填字段
        if (!realName || !idNumber || !teacherCertificate) {
            return res.status(400).send({ error: '请提供所有必填信息' });
        }

        // 更新教师认证信息
        req.user.verification = {
            realName,
            idNumber,
            teacherCertificate,
            status: 'pending', // 待审核
            submittedAt: new Date()
        };

        await req.user.save();
        res.send({ message: '认证信息已提交，等待审核' });
    } catch (error) {
        res.status(500).send({ error: '提交认证信息失败' });
    }
});

module.exports = router; 