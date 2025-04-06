const mongoose = require('mongoose');

const AiChatSchema = new mongoose.Schema({
    student: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, '请提供学生ID']
    },
    title: {
        type: String,
        default: '新会话'
    },
    messages: [
        {
            role: {
                type: String,
                enum: ['user', 'assistant', 'system'],
                required: true
            },
            content: {
                type: String,
                required: true
            },
            timestamp: {
                type: Date,
                default: Date.now
            }
        }
    ],
    subject: {
        type: String,
        default: '通用'
    },
    grade: {
        type: String
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    },
    isActive: {
        type: Boolean,
        default: true
    }
});

// 更新时间
AiChatSchema.pre('save', function (next) {
    this.updatedAt = Date.now();

    // 如果是新会话且没有设置标题，使用第一条用户消息作为标题
    if (this.isNew && this.title === '新会话' && this.messages.length > 0) {
        const firstUserMessage = this.messages.find(m => m.role === 'user');
        if (firstUserMessage) {
            // 截取前20个字符作为标题
            this.title = firstUserMessage.content.substring(0, 20) +
                (firstUserMessage.content.length > 20 ? '...' : '');
        }
    }

    next();
});

module.exports = mongoose.model('AiChat', AiChatSchema); 