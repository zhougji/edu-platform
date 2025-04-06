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
        unique: true,
        sparse: true, // 允许多个文档的此字段为null
        trim: true,
        lowercase: true
    },
    phone: {
        type: String,
        unique: true,
        sparse: true, // 允许多个文档的此字段为null
        trim: true
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
        required: true,
        enum: ['student', 'teacher', 'admin']
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
        realName: String,
        avatar: String,
        age: Number,
        grade: String, // 适用于学生
        subjects: [String], // 适用于教师，教授的学科
        bio: String,
        specialties: [String] // 适用于教师，擅长的内容
    },
    verification: { // 教师实名认证信息
        realName: String,
        idNumber: String,
        teacherCertificate: String,
        status: {
            type: String,
            enum: ['pending', 'approved', 'rejected'],
            default: 'pending'
        },
        submittedAt: Date,
        reviewedAt: Date
    },
    tokens: [{
        token: {
            type: String,
            required: true
        }
    }],
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

// 用户对象转JSON时去除敏感信息
UserSchema.methods.toJSON = function () {
    const user = this;
    const userObject = user.toObject();

    delete userObject.password;
    delete userObject.tokens;

    if (user.role === 'teacher' && userObject.verification) {
        delete userObject.verification.idNumber;
    }

    return userObject;
};

module.exports = mongoose.model('User', UserSchema); 