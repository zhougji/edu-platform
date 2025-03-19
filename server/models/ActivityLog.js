const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ActivityLogSchema = new Schema({
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: false // 允许匿名活动
    },
    userType: {
        type: String,
        enum: ['student', 'teacher', 'admin', 'system', 'anonymous'],
        required: true
    },
    actionType: {
        type: String,
        enum: [
            'login', 'logout', 'register',
            'view_resource', 'download_resource', 'upload_resource', 'rate_resource',
            'create_consultation', 'accept_consultation', 'end_consultation', 'message_sent',
            'ai_suggestion_request', 'profile_update', 'search',
            'system_error', 'system_notification'
        ],
        required: true
    },
    resourceId: {
        type: Schema.Types.ObjectId,
        ref: 'Resource',
        required: false // 仅针对资源相关活动
    },
    consultationId: {
        type: Schema.Types.ObjectId,
        ref: 'Consultation',
        required: false // 仅针对咨询相关活动
    },
    metadata: {
        type: Map,
        of: Schema.Types.Mixed, // 存储额外信息，如搜索关键词、资源类型等
        default: {}
    },
    deviceInfo: {
        type: {
            deviceType: String, // 'mobile', 'tablet', 'desktop'
            browser: String,
            os: String,
            ip: String
        },
        required: false
    },
    status: {
        type: String,
        enum: ['success', 'failure', 'pending', 'cancelled'],
        default: 'success'
    },
    errorDetails: {
        type: String,
        required: false // 仅对失败的操作记录错误
    },
    timestamp: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// 建立索引以优化查询
ActivityLogSchema.index({ userId: 1 });
ActivityLogSchema.index({ actionType: 1 });
ActivityLogSchema.index({ timestamp: 1 });
ActivityLogSchema.index({ 'deviceInfo.deviceType': 1 });

module.exports = mongoose.model('ActivityLog', ActivityLogSchema); 