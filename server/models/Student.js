const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const studentSchema = new mongoose.Schema({
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
    grade: {
        type: String
    },
    school: {
        type: String
    },
    region: {
        type: String
    },
    avatar: {
        type: String
    },
    isLowIncome: {
        type: Boolean,
        default: false
    },
    verificationStatus: {
        type: String,
        enum: ['pending', 'verified', 'rejected'],
        default: 'pending'
    },
    learningHistory: [{
        subject: String,
        resourceId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Resource'
        },
        viewedAt: Date
    }],
    registerDate: {
        type: Date,
        default: Date.now
    },
    lastLogin: {
        type: Date
    }
});

// 密码加密
studentSchema.pre('save', async function (next) {
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
studentSchema.methods.comparePassword = async function (candidatePassword) {
    return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('Student', studentSchema); 