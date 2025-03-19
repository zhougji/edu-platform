const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const teacherSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    avatar: {
        type: String
    },
    bio: {
        type: String
    },
    subjects: {
        type: [String],
        enum: ['math', 'chinese', 'english', 'physics', 'chemistry', 'biology', 'history', 'geography', 'politics', 'other']
    },
    qualification: {
        type: String
    },
    institution: {
        type: String
    },
    experience: {
        type: Number
    },
    rating: {
        type: Number,
        default: 0
    },
    reviewCount: {
        type: Number,
        default: 0
    },
    responseRate: {
        type: Number,
        default: 0
    },
    completedConsultations: {
        type: Number,
        default: 0
    },
    activeConsultations: {
        type: Number,
        default: 0
    },
    isVerified: {
        type: Boolean,
        default: false
    },
    registerDate: {
        type: Date,
        default: Date.now
    },
    lastLogin: {
        type: Date
    }
});

// 密码加密
teacherSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next();

    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        next(error);
    }
});

// 验证密码
teacherSchema.methods.comparePassword = async function (candidatePassword) {
    return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('Teacher', teacherSchema); 