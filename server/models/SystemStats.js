const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const SystemStatsSchema = new Schema({
    // 统计日期，每天一条记录
    date: {
        type: Date,
        required: true,
        unique: true
    },
    // 用户活动统计
    userActivity: {
        totalLogins: { type: Number, default: 0 },
        uniqueActiveUsers: { type: Number, default: 0 },
        newRegistrations: { type: Number, default: 0 },
        studentLogins: { type: Number, default: 0 },
        teacherLogins: { type: Number, default: 0 },
        adminLogins: { type: Number, default: 0 }
    },
    // 资源使用统计
    resourceActivity: {
        totalViews: { type: Number, default: 0 },
        totalDownloads: { type: Number, default: 0 },
        totalUploads: { type: Number, default: 0 },
        resourcesBySubject: { type: Map, of: Number, default: {} },
        resourcesByType: { type: Map, of: Number, default: {} },
        mostViewedResource: { type: Schema.Types.ObjectId, ref: 'Resource' },
        topRatedResources: [{ type: Schema.Types.ObjectId, ref: 'Resource' }]
    },
    // 咨询活动统计
    consultationActivity: {
        totalRequests: { type: Number, default: 0 },
        acceptedConsultations: { type: Number, default: 0 },
        completedConsultations: { type: Number, default: 0 },
        averageConsultationDuration: { type: Number, default: 0 }, // 分钟
        totalMessagesSent: { type: Number, default: 0 },
        consultationsBySubject: { type: Map, of: Number, default: {} }
    },
    // AI学习助手使用统计
    aiActivity: {
        totalRequests: { type: Number, default: 0 },
        uniqueUsersUsedAI: { type: Number, default: 0 },
        averageResponseTime: { type: Number, default: 0 }, // 毫秒
        topQueryTypes: [{ type: String }],
        apiErrorRate: { type: Number, default: 0 } // 百分比
    },
    // 搜索统计
    searchActivity: {
        totalSearches: { type: Number, default: 0 },
        topSearchTerms: [{ term: String, count: Number }],
        averageSearchResultsClicked: { type: Number, default: 0 }
    },
    // 系统性能统计
    systemPerformance: {
        averageResponseTime: { type: Number, default: 0 }, // 毫秒
        peakConcurrentUsers: { type: Number, default: 0 },
        errors: { type: Number, default: 0 },
        apiCalls: { type: Number, default: 0 },
        serverLoad: { type: Number, default: 0 }, // 百分比
        memoryUsage: { type: Number, default: 0 } // MB
    }
}, {
    timestamps: true
});

// 创建索引
SystemStatsSchema.index({ date: 1 });

// 更新今日系统统计的静态方法
SystemStatsSchema.statics.updateDailyStats = async function (updateData) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // 使用findOneAndUpdate并设置upsert选项，如果记录不存在则创建
    const result = await this.findOneAndUpdate(
        { date: today },
        { $inc: updateData },
        { upsert: true, new: true }
    );

    return result;
};

// 获取特定时间范围内的统计信息
SystemStatsSchema.statics.getStatsInRange = async function (startDate, endDate) {
    return this.find({
        date: {
            $gte: new Date(startDate),
            $lte: new Date(endDate)
        }
    }).sort({ date: 1 });
};

// 获取各项指标的趋势数据
SystemStatsSchema.statics.getTrends = async function (days = 30) {
    const endDate = new Date();
    endDate.setHours(0, 0, 0, 0);

    const startDate = new Date(endDate);
    startDate.setDate(startDate.getDate() - days);

    const stats = await this.find({
        date: {
            $gte: startDate,
            $lte: endDate
        }
    }).sort({ date: 1 });

    // 转换为趋势数据格式
    const trends = {
        dates: [],
        activeUsers: [],
        newUsers: [],
        resourceViews: [],
        consultations: [],
        aiRequests: []
    };

    stats.forEach(stat => {
        trends.dates.push(stat.date.toISOString().split('T')[0]);
        trends.activeUsers.push(stat.userActivity.uniqueActiveUsers);
        trends.newUsers.push(stat.userActivity.newRegistrations);
        trends.resourceViews.push(stat.resourceActivity.totalViews);
        trends.consultations.push(stat.consultationActivity.totalRequests);
        trends.aiRequests.push(stat.aiActivity.totalRequests);
    });

    return trends;
};

module.exports = mongoose.model('SystemStats', SystemStatsSchema); 