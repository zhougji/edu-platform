const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const UserSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, '请提供姓名'],
        trim: true
    },
    email: {
        type: String,
        required: [true, '请提供邮箱'],
        unique: true,
        match: [
            /^([\w-\.]+@([\w-]+\.)+[\w-]{2,4})?$/,
            '请提供有效的邮箱地址'
        ],
        lowercase: true
    },
    password: {
        type: String,
        required: [true, '请设置密码'],
        minlength: [6, '密码至少需要6个字符'],
        select: false
    },
    avatar: {
        type: String,
        default: 'default-avatar.jpg'
    },
    role: {
        type: String,
        enum: ['student', 'teacher', 'admin'],
        default: 'student'
    },
    isEmailVerified: {
        type: Boolean,
        default: false
    },
    emailVerificationToken: String,
    emailVerificationExpire: Date,
    resetPasswordToken: String,
    resetPasswordExpire: Date,
    profile: {
        // 共有属性
        bio: String,
        phone: String,

        // 学生特有属性
        grade: String,
        interests: [String],

        // 教师特有属性
        subject: String,
        title: String,
        experience: Number,
        expertise: [String]
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    lastActive: {
        type: Date,
        default: Date.now
    }
});

// 密码加密中间件
UserSchema.pre('save', async function (next) {
    // 只在密码被修改时才重新加密
    if (!this.isModified('password')) {
        return next();
    }

    try {
        // 生成盐
        const salt = await bcrypt.genSalt(10);
        // 加密密码
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        next(error);
    }
});

// 比较密码方法
UserSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

// 生成邮箱验证令牌
UserSchema.methods.generateEmailVerificationToken = function () {
    // 生成随机令牌
    const verificationToken = crypto.randomBytes(20).toString('hex');

    // 加密令牌并保存到数据库
    this.emailVerificationToken = crypto
        .createHash('sha256')
        .update(verificationToken)
        .digest('hex');

    // 设置过期时间（24小时）
    this.emailVerificationExpire = Date.now() + 24 * 60 * 60 * 1000;

    // 返回未加密的令牌（用于发送邮件）
    return verificationToken;
};

// 生成密码重置令牌
UserSchema.methods.generateResetPasswordToken = function () {
    // 生成随机令牌
    const resetToken = crypto.randomBytes(20).toString('hex');

    // 加密令牌并保存到数据库
    this.resetPasswordToken = crypto
        .createHash('sha256')
        .update(resetToken)
        .digest('hex');

    // 设置过期时间（1小时）
    this.resetPasswordExpire = Date.now() + 60 * 60 * 1000;

    // 返回未加密的令牌（用于发送邮件）
    return resetToken;
};

module.exports = mongoose.model('User', UserSchema); 