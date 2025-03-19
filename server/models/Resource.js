const mongoose = require('mongoose');

const resourceSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    subject: {
        type: String,
        required: true,
        enum: ['math', 'chinese', 'english', 'physics', 'chemistry', 'biology', 'history', 'geography', 'politics', 'other']
    },
    type: {
        type: String,
        required: true,
        enum: ['video', 'document', 'exercise', 'link', 'other']
    },
    level: {
        type: String,
        required: true,
        enum: ['beginner', 'intermediate', 'advanced']
    },
    url: {
        type: String,
        required: true
    },
    downloadUrl: {
        type: String
    },
    thumbnail: {
        type: String
    },
    author: {
        type: String
    },
    authorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Teacher'
    },
    uploadDate: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    },
    viewCount: {
        type: Number,
        default: 0
    },
    downloadCount: {
        type: Number,
        default: 0
    },
    rating: {
        type: Number,
        default: 0
    },
    ratingCount: {
        type: Number,
        default: 0
    },
    isApproved: {
        type: Boolean,
        default: true
    },
    keywords: {
        type: [String]
    },
    content: {
        type: mongoose.Schema.Types.Mixed // For exercises or structured content
    },
    fileSize: {
        type: Number
    },
    duration: {
        type: Number // For video resources (in seconds)
    }
});

// 添加全文搜索索引
resourceSchema.index({
    title: 'text',
    description: 'text',
    keywords: 'text'
});

module.exports = mongoose.model('Resource', resourceSchema); 