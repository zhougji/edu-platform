const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const LoggingService = require('../services/LoggingService');
const mongoose = require('mongoose');

/**
 * @route   POST /api/learning-time
 * @desc    记录学生的学习时间
 * @access  Private
 */
router.post('/', auth, async (req, res) => {
    try {
        const { subject, minutes, resourceId } = req.body;

        if (!subject || !minutes) {
            return res.status(400).json({ message: '缺少必要参数' });
        }

        // 确保minutes是有效的数字
        const minutesNum = parseInt(minutes);
        if (isNaN(minutesNum) || minutesNum <= 0) {
            return res.status(400).json({ message: '学习时间必须是正数' });
        }

        // 获取学生ID
        const studentId = req.user.id;

        // 构建元数据对象
        const metadata = { subject, minutes: minutesNum };
        if (resourceId) {
            try {
                metadata.resourceId = mongoose.Types.ObjectId(resourceId);
            } catch (error) {
                // 如果resourceId不是有效的ObjectId，忽略它
                console.warn('无效的资源ID:', resourceId);
            }
        }

        // 记录学习时间
        await LoggingService.recordLearningTime(studentId, subject, minutesNum);

        res.json({ message: '学习时间记录成功', minutes: minutesNum });
    } catch (error) {
        console.error('记录学习时间失败:', error);
        res.status(500).json({ message: '服务器错误，无法记录学习时间' });
    }
});

/**
 * @route   GET /api/learning-time/stats
 * @desc    获取学生的学习时间统计
 * @access  Private
 */
router.get('/stats', auth, async (req, res) => {
    try {
        const studentId = req.user.id;

        // 获取学习统计数据
        const stats = await LoggingService.getStudentLearningStats(studentId);

        // 获取过去7天的学习记录
        const today = new Date();
        const oneWeekAgo = new Date(today);
        oneWeekAgo.setDate(today.getDate() - 7);

        // 准备7天的日期数组
        const weekDays = [];
        for (let i = 6; i >= 0; i--) {
            const day = new Date(today);
            day.setDate(day.getDate() - i);
            weekDays.push(day.toISOString().split('T')[0]);
        }

        // 获取每日学习数据
        const dailyStats = {};
        weekDays.forEach(day => {
            dailyStats[day] = 0;
        });

        // 如果有每日活动记录，填充到对应日期
        if (stats.dailyActivity && stats.dailyActivity.length > 0) {
            stats.dailyActivity.forEach(activity => {
                const activityDate = new Date(activity.date).toISOString().split('T')[0];
                if (dailyStats[activityDate] !== undefined) {
                    dailyStats[activityDate] = activity.activeMinutes;
                }
            });
        }

        // 构建响应数据
        const responseData = {
            totalTimeBySubject: Object.fromEntries(stats.subjectTimeSpent),
            viewsBySubject: Object.fromEntries(stats.subjectResourceViews),
            viewsByType: Object.fromEntries(stats.resourceTypeViews),
            aiUsageCount: stats.aiLearningUsageCount,
            weeklyActivity: Object.entries(dailyStats).map(([date, minutes]) => ({
                date,
                minutes
            })),
            totalLearningMinutes: Array.from(stats.subjectTimeSpent.values()).reduce((sum, time) => sum + time, 0)
        };

        res.json(responseData);
    } catch (error) {
        console.error('获取学习统计失败:', error);
        res.status(500).json({ message: '服务器错误，无法获取学习统计' });
    }
});

module.exports = router; 