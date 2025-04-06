const mongoose = require('mongoose');

const ConsultationSchema = new mongoose.Schema({
    student: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, '请提供学生ID']
    },
    teacher: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, '请提供教师ID']
    },
    subject: {
        type: String,
        required: [true, '请提供咨询学科']
    },
    question: {
        type: String,
        required: [true, '请提供咨询问题'],
        maxlength: [1000, '问题描述不能超过1000个字符']
    },
    status: {
        type: String,
        enum: ['pending', 'accepted', 'rejected', 'completed', 'canceled'],
        default: 'pending'
    },
    scheduledTime: {
        type: Date
    },
    duration: {
        type: Number, // 单位：分钟
        default: 30
    },
    messages: [
        {
            sender: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User',
                required: true
            },
            content: {
                type: String,
                required: [true, '消息内容不能为空']
            },
            timestamp: {
                type: Date,
                default: Date.now
            },
            read: {
                type: Boolean,
                default: false
            }
        }
    ],
    feedback: {
        rating: {
            type: Number,
            min: 1,
            max: 5
        },
        comment: String,
        createdAt: Date
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// 更新时间钩子
ConsultationSchema.pre('save', function (next) {
    this.updatedAt = Date.now();
    next();
});

module.exports = mongoose.model('Consultation', ConsultationSchema); 