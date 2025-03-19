const ActivityLog = require('../models/ActivityLog');
const SystemStats = require('../models/SystemStats');
const LearningStats = require('../models/LearningStats');
const useragent = require('useragent');

class LoggingService {
    /**
     * 记录用户活动
     * @param {Object} logData - 活动日志数据
     * @returns {Promise<Object>} - 创建的活动日志对象
     */
    static async logActivity(logData) {
        try {
            const activityLog = new ActivityLog(logData);
            await activityLog.save();

            // 同时更新系统统计数据
            await this.updateSystemStats(logData);

            // 如果是学生活动，还要更新学习统计
            if (logData.userType === 'student') {
                await this.updateLearningStats(logData);
            }

            return activityLog;
        } catch (error) {
            console.error('记录活动日志失败:', error);
            throw error;
        }
    }

    /**
     * 从请求信息中获取设备信息
     * @param {Object} req - Express请求对象
     * @returns {Object} - 设备信息对象
     */
    static getDeviceInfo(req) {
        const ua = useragent.parse(req.headers['user-agent']);
        const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;

        let deviceType = 'desktop';
        if (ua.device.family !== 'Other') {
            if (/mobile/i.test(ua.device.family)) {
                deviceType = 'mobile';
            } else if (/tablet/i.test(ua.device.family)) {
                deviceType = 'tablet';
            }
        }

        return {
            deviceType,
            browser: `${ua.family} ${ua.major}.${ua.minor}`,
            os: `${ua.os.family} ${ua.os.major}`,
            ip
        };
    }

    /**
     * 基于活动日志更新系统统计
     * @param {Object} logData - 活动日志数据
     * @returns {Promise<void>}
     */
    static async updateSystemStats(logData) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        try {
            // 构建更新数据
            const updateData = {};

            // 根据活动类型更新不同的统计指标
            switch (logData.actionType) {
                case 'login':
                    updateData['userActivity.totalLogins'] = 1;
                    if (logData.userType === 'student') {
                        updateData['userActivity.studentLogins'] = 1;
                    } else if (logData.userType === 'teacher') {
                        updateData['userActivity.teacherLogins'] = 1;
                    } else if (logData.userType === 'admin') {
                        updateData['userActivity.adminLogins'] = 1;
                    }
                    break;

                case 'register':
                    updateData['userActivity.newRegistrations'] = 1;
                    break;

                case 'view_resource':
                    updateData['resourceActivity.totalViews'] = 1;

                    // 如果有资源分类信息，更新按类别统计
                    if (logData.metadata && logData.metadata.subject) {
                        updateData[`resourceActivity.resourcesBySubject.${logData.metadata.subject}`] = 1;
                    }
                    if (logData.metadata && logData.metadata.resourceType) {
                        updateData[`resourceActivity.resourcesByType.${logData.metadata.resourceType}`] = 1;
                    }
                    break;

                case 'download_resource':
                    updateData['resourceActivity.totalDownloads'] = 1;
                    break;

                case 'upload_resource':
                    updateData['resourceActivity.totalUploads'] = 1;
                    break;

                case 'create_consultation':
                    updateData['consultationActivity.totalRequests'] = 1;

                    if (logData.metadata && logData.metadata.subject) {
                        updateData[`consultationActivity.consultationsBySubject.${logData.metadata.subject}`] = 1;
                    }
                    break;

                case 'accept_consultation':
                    updateData['consultationActivity.acceptedConsultations'] = 1;
                    break;

                case 'end_consultation':
                    updateData['consultationActivity.completedConsultations'] = 1;
                    break;

                case 'message_sent':
                    updateData['consultationActivity.totalMessagesSent'] = 1;
                    break;

                case 'ai_suggestion_request':
                    updateData['aiActivity.totalRequests'] = 1;
                    break;

                case 'search':
                    updateData['searchActivity.totalSearches'] = 1;
                    break;

                case 'system_error':
                    updateData['systemPerformance.errors'] = 1;
                    break;
            }

            if (Object.keys(updateData).length > 0) {
                await SystemStats.updateDailyStats(updateData);
            }
        } catch (error) {
            console.error('更新系统统计失败:', error);
            // 这里我们不抛出错误，防止影响主流程
        }
    }

    /**
     * 更新学生的学习统计数据
     * @param {Object} logData - 活动日志数据
     * @returns {Promise<void>}
     */
    static async updateLearningStats(logData) {
        if (!logData.userId) return;

        try {
            switch (logData.actionType) {
                case 'view_resource':
                    if (logData.metadata && logData.metadata.subject && logData.metadata.resourceType) {
                        await LearningStats.recordResourceView(
                            logData.userId,
                            logData.metadata.subject,
                            logData.metadata.resourceType
                        );
                    }
                    break;

                case 'ai_suggestion_request':
                    // 更新AI助手使用次数
                    const stats = await LearningStats.findOne({ studentId: logData.userId });
                    if (stats) {
                        stats.aiLearningUsageCount += 1;
                        stats.lastUpdated = new Date();
                        await stats.save();
                    } else {
                        // 如果没有统计记录，创建一个新的
                        const newStats = new LearningStats({
                            studentId: logData.userId,
                            aiLearningUsageCount: 1
                        });
                        await newStats.save();
                    }
                    break;
            }
        } catch (error) {
            console.error('更新学习统计失败:', error);
            // 这里我们不抛出错误，防止影响主流程
        }
    }

    /**
     * 记录学习时间
     * @param {String} studentId - 学生ID
     * @param {String} subject - 学习科目
     * @param {Number} minutes - 学习时间（分钟）
     * @returns {Promise<void>}
     */
    static async recordLearningTime(studentId, subject, minutes) {
        try {
            await LearningStats.updateSubjectTime(studentId, subject, minutes);

            // 记录活动日志
            await this.logActivity({
                userId: studentId,
                userType: 'student',
                actionType: 'study_time',
                metadata: {
                    subject,
                    minutes
                },
                status: 'success'
            });
        } catch (error) {
            console.error('记录学习时间失败:', error);
            throw error;
        }
    }

    /**
     * 获取学习统计数据
     * @param {String} studentId - 学生ID
     * @returns {Promise<Object>} - 学习统计数据
     */
    static async getStudentLearningStats(studentId) {
        try {
            let stats = await LearningStats.findOne({ studentId });

            if (!stats) {
                // 如果没有统计记录，创建一个新的
                stats = new LearningStats({ studentId });
                await stats.save();
            }

            return stats;
        } catch (error) {
            console.error('获取学习统计失败:', error);
            throw error;
        }
    }

    /**
     * 获取系统整体统计数据
     * @param {Number} days - 获取最近多少天的数据
     * @returns {Promise<Object>} - 系统统计数据
     */
    static async getSystemStatsTrends(days = 30) {
        try {
            return await SystemStats.getTrends(days);
        } catch (error) {
            console.error('获取系统统计趋势失败:', error);
            throw error;
        }
    }
}

module.exports = LoggingService; 