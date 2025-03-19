const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const adminAuth = require('../middleware/adminAuth');
const LoggingService = require('../services/LoggingService');
const ActivityLog = require('../models/ActivityLog');
const SystemStats = require('../models/SystemStats');
const LearningStats = require('../models/LearningStats');
const Student = require('../models/Student');
const Resource = require('../models/Resource');

// 中间件：验证管理员权限
router.use(auth);
router.use(adminAuth);

/**
 * @route   GET /api/admin/stats/overview
 * @desc    获取平台整体统计概览数据
 * @access  Private/Admin
 */
router.get('/overview', async (req, res) => {
    try {
        // 获取时间范围参数
        const { days = 30 } = req.query;

        // 获取系统趋势数据
        const trends = await LoggingService.getSystemStatsTrends(parseInt(days));

        // 获取当前注册用户总数
        const studentCount = await Student.countDocuments();

        // 获取当前资源总数
        const resourceCount = await Resource.countDocuments();

        // 获取今日活跃用户数
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const activeTodayCount = await ActivityLog.countDocuments({
            actionType: 'login',
            timestamp: { $gte: today }
        });

        // 获取今日新用户注册数
        const newTodayCount = await ActivityLog.countDocuments({
            actionType: 'register',
            timestamp: { $gte: today }
        });

        // 获取今日资源访问数
        const resourceViewsToday = await ActivityLog.countDocuments({
            actionType: 'view_resource',
            timestamp: { $gte: today }
        });

        // 获取过去7天平均在线时长
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

        const weeklyTimeStats = await ActivityLog.aggregate([
            {
                $match: {
                    actionType: 'study_time',
                    timestamp: { $gte: oneWeekAgo }
                }
            },
            {
                $group: {
                    _id: null,
                    totalMinutes: { $sum: '$metadata.minutes' },
                    count: { $sum: 1 }
                }
            }
        ]);

        const averageStudyTime = weeklyTimeStats.length > 0
            ? (weeklyTimeStats[0].totalMinutes / weeklyTimeStats[0].count).toFixed(1)
            : 0;

        // 资源使用情况
        const resourceUsage = await ActivityLog.aggregate([
            {
                $match: {
                    actionType: { $in: ['view_resource', 'download_resource'] },
                    'metadata.resourceType': { $exists: true }
                }
            },
            {
                $group: {
                    _id: '$metadata.resourceType',
                    count: { $sum: 1 }
                }
            },
            {
                $sort: { count: -1 }
            }
        ]);

        // 构建响应对象
        const response = {
            overview: {
                totalStudents: studentCount,
                totalResources: resourceCount,
                activeTodayCount,
                newTodayCount,
                resourceViewsToday,
                averageStudyTime
            },
            trends,
            resourceUsage: resourceUsage.map(item => ({
                type: item._id,
                count: item.count
            }))
        };

        res.json(response);
    } catch (error) {
        console.error('获取统计概览失败:', error);
        res.status(500).json({ message: '获取统计概览失败' });
    }
});

/**
 * @route   GET /api/admin/stats/user-activity
 * @desc    获取用户活动详细统计
 * @access  Private/Admin
 */
router.get('/user-activity', async (req, res) => {
    try {
        // 分页参数
        const { page = 1, limit = 20 } = req.query;
        const skip = (parseInt(page) - 1) * parseInt(limit);

        // 查询参数
        const { userId, actionType, startDate, endDate } = req.query;

        // 构建查询条件
        const query = {};

        if (userId) query.userId = userId;
        if (actionType) query.actionType = actionType;

        if (startDate || endDate) {
            query.timestamp = {};
            if (startDate) query.timestamp.$gte = new Date(startDate);
            if (endDate) query.timestamp.$lte = new Date(endDate);
        }

        // 查询活动日志
        const logs = await ActivityLog.find(query)
            .sort({ timestamp: -1 })
            .skip(skip)
            .limit(parseInt(limit))
            .populate('userId', 'name email role');

        // 获取总记录数
        const total = await ActivityLog.countDocuments(query);

        // 获取活动类型分布
        const actionTypeDistribution = await ActivityLog.aggregate([
            { $match: query },
            { $group: { _id: '$actionType', count: { $sum: 1 } } },
            { $sort: { count: -1 } }
        ]);

        res.json({
            logs,
            pagination: {
                total,
                page: parseInt(page),
                limit: parseInt(limit),
                pages: Math.ceil(total / parseInt(limit))
            },
            actionTypeDistribution: actionTypeDistribution.map(item => ({
                type: item._id,
                count: item.count
            }))
        });
    } catch (error) {
        console.error('获取用户活动统计失败:', error);
        res.status(500).json({ message: '获取用户活动统计失败' });
    }
});

/**
 * @route   GET /api/admin/stats/student/:studentId
 * @desc    获取特定学生的学习统计数据
 * @access  Private/Admin
 */
router.get('/student/:studentId', async (req, res) => {
    try {
        const { studentId } = req.params;

        // 获取学生信息
        const student = await Student.findById(studentId);
        if (!student) {
            return res.status(404).json({ message: '未找到学生信息' });
        }

        // 获取学习统计数据
        const learningStats = await LoggingService.getStudentLearningStats(studentId);

        // 获取活动日志
        const activityLogs = await ActivityLog.find({ userId: studentId })
            .sort({ timestamp: -1 })
            .limit(30);

        // 获取最近一周的学习时间统计
        const today = new Date();
        const oneWeekAgo = new Date(today);
        oneWeekAgo.setDate(today.getDate() - 7);

        const weeklyActivity = await ActivityLog.aggregate([
            {
                $match: {
                    userId: mongoose.Types.ObjectId(studentId),
                    actionType: 'study_time',
                    timestamp: { $gte: oneWeekAgo }
                }
            },
            {
                $group: {
                    _id: { $dateToString: { format: '%Y-%m-%d', date: '$timestamp' } },
                    totalMinutes: { $sum: '$metadata.minutes' }
                }
            },
            {
                $sort: { _id: 1 }
            }
        ]);

        // 构建每日学习时间数据
        const dailyStudyTime = [];
        for (let i = 0; i < 7; i++) {
            const date = new Date(oneWeekAgo);
            date.setDate(date.getDate() + i);
            const dateString = date.toISOString().split('T')[0];

            const found = weeklyActivity.find(item => item._id === dateString);
            dailyStudyTime.push({
                date: dateString,
                minutes: found ? found.totalMinutes : 0
            });
        }

        res.json({
            student: {
                id: student._id,
                name: student.name,
                email: student.email,
                grade: student.grade
            },
            learningStats,
            activityLogs,
            dailyStudyTime
        });
    } catch (error) {
        console.error('获取学生统计数据失败:', error);
        res.status(500).json({ message: '获取学生统计数据失败' });
    }
});

/**
 * @route   GET /api/admin/stats/resources
 * @desc    获取资源使用统计数据
 * @access  Private/Admin
 */
router.get('/resources', async (req, res) => {
    try {
        // 获取最受欢迎的资源
        const popularResources = await ActivityLog.aggregate([
            {
                $match: {
                    actionType: 'view_resource',
                    resourceId: { $exists: true }
                }
            },
            {
                $group: {
                    _id: '$resourceId',
                    viewCount: { $sum: 1 }
                }
            },
            {
                $sort: { viewCount: -1 }
            },
            {
                $limit: 10
            },
            {
                $lookup: {
                    from: 'resources',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'resourceDetails'
                }
            },
            {
                $unwind: '$resourceDetails'
            },
            {
                $project: {
                    resourceId: '$_id',
                    title: '$resourceDetails.title',
                    type: '$resourceDetails.type',
                    subject: '$resourceDetails.subject',
                    viewCount: 1
                }
            }
        ]);

        // 获取按主题的资源使用分布
        const subjectDistribution = await ActivityLog.aggregate([
            {
                $match: {
                    actionType: 'view_resource',
                    'metadata.subject': { $exists: true }
                }
            },
            {
                $group: {
                    _id: '$metadata.subject',
                    count: { $sum: 1 }
                }
            },
            {
                $sort: { count: -1 }
            }
        ]);

        // 获取按资源类型的使用分布
        const typeDistribution = await ActivityLog.aggregate([
            {
                $match: {
                    actionType: 'view_resource',
                    'metadata.resourceType': { $exists: true }
                }
            },
            {
                $group: {
                    _id: '$metadata.resourceType',
                    count: { $sum: 1 }
                }
            },
            {
                $sort: { count: -1 }
            }
        ]);

        // 获取每日资源访问趋势
        const today = new Date();
        const thirtyDaysAgo = new Date(today);
        thirtyDaysAgo.setDate(today.getDate() - 30);

        const dailyViews = await ActivityLog.aggregate([
            {
                $match: {
                    actionType: 'view_resource',
                    timestamp: { $gte: thirtyDaysAgo }
                }
            },
            {
                $group: {
                    _id: { $dateToString: { format: '%Y-%m-%d', date: '$timestamp' } },
                    count: { $sum: 1 }
                }
            },
            {
                $sort: { _id: 1 }
            }
        ]);

        res.json({
            popularResources,
            subjectDistribution: subjectDistribution.map(item => ({
                subject: item._id,
                count: item.count
            })),
            typeDistribution: typeDistribution.map(item => ({
                type: item._id,
                count: item.count
            })),
            dailyViews
        });
    } catch (error) {
        console.error('获取资源统计数据失败:', error);
        res.status(500).json({ message: '获取资源统计数据失败' });
    }
});

module.exports = router; 