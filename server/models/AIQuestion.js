const mongoose = require('mongoose');

const AIQuestionSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    question: {
        type: String,
        required: [true, '请提供问题内容'],
        trim: true
    },
    answer: {
        type: String,
        required: true
    },
    subject: {
        type: String,
        enum: ['mathematics', 'physics', 'chemistry', 'biology', 'history',
            'geography', 'literature', 'english', 'computer_science', 'other'],
        default: 'other'
    },
    keywords: [String],
    feedback: {
        helpful: {
            type: Boolean
        },
        comments: {
            type: String
        }
    },
    model: {
        type: String,
        default: 'deepseek-r1'
    },
    promptTokens: {
        type: Number,
        default: 0
    },
    completionTokens: {
        type: Number,
        default: 0
    },
    totalTokens: {
        type: Number,
        default: 0
    },
    processingTime: {
        type: Number, // 毫秒
        default: 0
    },
    relatedQuestions: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'AIQuestion'
        }
    ],
    relatedResources: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Resource'
        }
    ],
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// 全文搜索索引
AIQuestionSchema.index({ question: 'text', answer: 'text', keywords: 'text' });
AIQuestionSchema.index({ user: 1, createdAt: -1 });
AIQuestionSchema.index({ subject: 1 });

module.exports = mongoose.model('AIQuestion', AIQuestionSchema); 