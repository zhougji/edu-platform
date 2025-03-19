const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const LearningStatsSchema = new Schema({
    studentId: {
        type: Schema.Types.ObjectId,
        ref: 'Student',
        required: true
    },
    // 每个科目的学习累计时间（分钟）
    subjectTimeSpent: {
        type: Map,
        of: Number,
        default: {}
    },
    // 每个科目的资源访问次数
    subjectResourceViews: {
        type: Map,
        of: Number,
        default: {}
    },
    // 每类资源的访问次数
    resourceTypeViews: {
        type: Map,
        of: Number,
        default: {}
    },
    // 咨询问题数量
    consultationCount: {
        type: Number,
        default: 0
    },
    // AI学习助手使用次数
    aiLearningUsageCount: {
        type: Number,
        default: 0
    },
    // 学习进度记录
    learningProgress: [{
        subject: String,
        chapter: String,
        completed: Boolean,
        score: Number, // 如自测得分
        timeSpent: Number, // 分钟
        completedAt: Date
    }],
    // 每日学习活跃度记录
    dailyActivity: [{
        date: {
            type: Date,
            required: true
        },
        activeMinutes: {
            type: Number,
            default: 0
        },
        resourcesViewed: {
            type: Number,
            default: 0
        },
        consultationsHeld: {
            type: Number,
            default: 0
        },
        subjects: [String] // 这一天学习的科目
    }],
    // 学习偏好
    learningPreferences: {
        preferredTimeOfDay: String, // 'morning', 'afternoon', 'evening', 'night'
        preferredResourceTypes: [String],
        preferredSubjects: [String],
        learningStyle: String // 'visual', 'auditory', 'reading', 'kinesthetic'
    },
    // 学习成果
    achievements: [{
        title: String,
        description: String,
        awardedAt: {
            type: Date,
            default: Date.now
        },
        category: String // 'completion', 'excellence', 'consistency', 'improvement'
    }],
    // 最后一次更新时间
    lastUpdated: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// 建立索引以加速查询
LearningStatsSchema.index({ studentId: 1 });
LearningStatsSchema.index({ 'dailyActivity.date': 1 });

// 更新学习统计信息的静态方法
LearningStatsSchema.statics.updateSubjectTime = async function (studentId, subject, minutes) {
    const stats = await this.findOne({ studentId });

    if (!stats) {
        // 如果还没有统计记录，创建一个新的
        const newStats = new this({
            studentId,
            subjectTimeSpent: { [subject]: minutes }
        });
        return newStats.save();
    }

    // 更新已有的统计记录
    const currentTime = stats.subjectTimeSpent.get(subject) || 0;
    stats.subjectTimeSpent.set(subject, currentTime + minutes);
    stats.lastUpdated = new Date();
    return stats.save();
};

// 记录资源访问
LearningStatsSchema.statics.recordResourceView = async function (studentId, subject, resourceType) {
    const stats = await this.findOne({ studentId });

    if (!stats) {
        // 如果还没有统计记录，创建一个新的
        const newStats = new this({
            studentId,
            subjectResourceViews: { [subject]: 1 },
            resourceTypeViews: { [resourceType]: 1 }
        });
        return newStats.save();
    }

    // 更新科目访问统计
    const currentSubjectViews = stats.subjectResourceViews.get(subject) || 0;
    stats.subjectResourceViews.set(subject, currentSubjectViews + 1);

    // 更新资源类型访问统计
    const currentTypeViews = stats.resourceTypeViews.get(resourceType) || 0;
    stats.resourceTypeViews.set(resourceType, currentTypeViews + 1);

    stats.lastUpdated = new Date();
    return stats.save();
};

// 添加每日活动记录
LearningStatsSchema.methods.addDailyActivity = function (date, minutes, resourcesViewed, subjects) {
    const today = new Date(date);
    today.setHours(0, 0, 0, 0);

    // 查找当天的记录
    const existingRecord = this.dailyActivity.find(record => {
        const recordDate = new Date(record.date);
        recordDate.setHours(0, 0, 0, 0);
        return recordDate.getTime() === today.getTime();
    });

    if (existingRecord) {
        // 更新现有记录
        existingRecord.activeMinutes += minutes;
        existingRecord.resourcesViewed += resourcesViewed;

        // 添加新学习的科目（去重）
        subjects.forEach(subject => {
            if (!existingRecord.subjects.includes(subject)) {
                existingRecord.subjects.push(subject);
            }
        });
    } else {
        // 创建新记录
        this.dailyActivity.push({
            date: today,
            activeMinutes: minutes,
            resourcesViewed: resourcesViewed,
            consultationsHeld: 0,
            subjects: subjects
        });
    }

    this.lastUpdated = new Date();
};

module.exports = mongoose.model('LearningStats', LearningStatsSchema); 