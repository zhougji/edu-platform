const mongoose = require('mongoose');

const ConsultationSchema = new mongoose.Schema({
    student: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, '请指定学生']
    },
    teacher: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, '请指定教师']
    },
    subject: {
        type: String,
        required: [true, '请指定咨询主题']
    },
    description: {
        type: String,
        required: [true, '请提供问题描述'],
        maxlength: [1000, '描述不能超过1000个字符']
    },
    status: {
        type: String,
        enum: ['pending', 'accepted', 'ongoing', 'completed', 'cancelled'],
        default: 'pending'
    },
    scheduledTime: {
        type: Date
    },
    duration: {
        type: Number, // 预计时长（分钟）
        default: 30
    },
    startTime: {
        type: Date
    },
    endTime: {
        type: Date
    },
    isVideoEnabled: {
        type: Boolean,
        default: true
    },
    sessionId: {
        type: String // 视频会话ID
    },
    rating: {
        type: Number,
        min: 1,
        max: 5
    },
    feedback: {
        type: String
    },
    messages: [
        {
            sender: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User',
                required: true
            },
            text: {
                type: String,
                required: true
            },
            timestamp: {
                type: Date,
                default: Date.now
            },
            isRead: {
                type: Boolean,
                default: false
            }
        }
    ],
    attachments: [
        {
            name: String,
            path: String,
            uploadedBy: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User'
            },
            uploadedAt: {
                type: Date,
                default: Date.now
            }
        }
    ],
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
}, {
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// 更新时间戳中间件
ConsultationSchema.pre('save', function (next) {
    this.updatedAt = Date.now();
    next();
});

// 获取未读消息数量
ConsultationSchema.methods.getUnreadMessages = function (userId) {
    return this.messages.filter(
        message => message.sender.toString() !== userId.toString() && !message.isRead
    ).length;
};

// 标记所有消息为已读
ConsultationSchema.methods.markAllAsRead = function (userId) {
    this.messages.forEach(message => {
        if (message.sender.toString() !== userId.toString()) {
            message.isRead = true;
        }
    });
    return this.save();
};

// 索引优化查询性能
ConsultationSchema.index({ student: 1, status: 1 });
ConsultationSchema.index({ teacher: 1, status: 1 });
ConsultationSchema.index({ createdAt: -1 });
ConsultationSchema.index({ status: 1, scheduledTime: 1 });

module.exports = mongoose.model('Consultation', ConsultationSchema); 