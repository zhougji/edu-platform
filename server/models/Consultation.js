const mongoose = require('mongoose');

const consultationSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Student',
        required: true
    },
    studentName: {
        type: String,
        required: true
    },
    studentGrade: {
        type: String
    },
    subject: {
        type: String,
        required: true,
        enum: ['math', 'chinese', 'english', 'physics', 'chemistry', 'biology', 'history', 'geography', 'politics', 'other']
    },
    question: {
        type: String,
        required: true
    },
    urgency: {
        type: String,
        enum: ['low', 'medium', 'high'],
        default: 'medium'
    },
    status: {
        type: String,
        enum: ['等待中', '已接受', '已完成', '已拒绝'],
        default: '等待中'
    },
    teacherId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Teacher'
    },
    teacherName: {
        type: String
    },
    date: {
        type: Date,
        default: Date.now
    },
    acceptedAt: {
        type: Date
    },
    completedAt: {
        type: Date
    }
});

module.exports = mongoose.model('Consultation', consultationSchema); 