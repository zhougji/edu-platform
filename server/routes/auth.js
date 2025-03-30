const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const { check, validationResult } = require('express-validator');
const User = require('../models/User');
const { generateToken, protect } = require('../middleware/auth');
const { sendVerificationEmail, sendPasswordResetEmail } = require('../utils/sendEmail');

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

module.exports = router; 