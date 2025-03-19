const LoggingService = require('../services/LoggingService');

/**
 * 记录API请求的中间件
 * 此中间件自动捕获并记录所有API请求，并提供基本的性能监控
 */
module.exports = function (req, res, next) {
    // 记录请求开始时间
    const startTime = Date.now();

    // 保存原始的end方法
    const originalEnd = res.end;

    // 重写响应的end方法来捕获请求结束时间和状态
    res.end = function (chunk, encoding) {
        // 恢复原始的end方法并调用它
        res.end = originalEnd;
        res.end(chunk, encoding);

        // 计算响应时间
        const responseTime = Date.now() - startTime;

        // 准备日志数据
        try {
            let userId = null;
            let userType = 'anonymous';

            // 尝试获取用户信息
            if (req.user) {
                userId = req.user.id || req.user._id;
                userType = req.user.role || req.user.type || 'anonymous';
            }

            // 确定操作类型
            let actionType = 'api_request';

            // 基于URL和HTTP方法推断操作类型
            const path = req.path.toLowerCase();

            if (path.includes('/auth/login')) {
                actionType = 'login';
            } else if (path.includes('/auth/register')) {
                actionType = 'register';
            } else if (path.includes('/resources') && req.method === 'GET') {
                actionType = 'view_resource';
            } else if (path.includes('/resources') && req.method === 'POST') {
                actionType = 'upload_resource';
            } else if (path.includes('/resources/download')) {
                actionType = 'download_resource';
            } else if (path.includes('/consultations') && req.method === 'POST') {
                actionType = 'create_consultation';
            } else if (path.includes('/consultations/accept')) {
                actionType = 'accept_consultation';
            } else if (path.includes('/consultations/end')) {
                actionType = 'end_consultation';
            } else if (path.includes('/consultation-messages') && req.method === 'POST') {
                actionType = 'message_sent';
            } else if (path.includes('/ai-learning')) {
                actionType = 'ai_suggestion_request';
            } else if (path.includes('/search')) {
                actionType = 'search';
            }

            // 收集请求元数据
            const metadata = {
                method: req.method,
                path: req.path,
                query: req.query,
                responseTime,
                statusCode: res.statusCode
            };

            // 如果是资源相关请求，尝试提取资源ID和类型
            if (actionType.includes('resource') && req.params.id) {
                metadata.resourceId = req.params.id;
            }

            if (req.body && !path.includes('/auth')) {
                // 避免记录敏感信息，如密码
                if (req.body.subject) metadata.subject = req.body.subject;
                if (req.body.resourceType) metadata.resourceType = req.body.resourceType;
                if (req.body.topic) metadata.topic = req.body.topic;
            }

            // 获取设备信息
            const deviceInfo = LoggingService.getDeviceInfo(req);

            // 确定请求状态
            const status = res.statusCode >= 200 && res.statusCode < 400 ? 'success' : 'failure';

            // 记录日志
            LoggingService.logActivity({
                userId,
                userType,
                actionType,
                metadata,
                deviceInfo,
                status,
                errorDetails: status === 'failure' ? `Status code: ${res.statusCode}` : null
            }).catch(err => {
                console.error('记录请求日志失败:', err);
            });

            // 同时更新系统性能统计
            if (global.systemPerfStats) {
                global.systemPerfStats.apiCalls++;
                global.systemPerfStats.totalResponseTime += responseTime;
                global.systemPerfStats.avgResponseTime = global.systemPerfStats.totalResponseTime / global.systemPerfStats.apiCalls;

                if (res.statusCode >= 400) {
                    global.systemPerfStats.errors++;
                }
            } else {
                global.systemPerfStats = {
                    apiCalls: 1,
                    totalResponseTime: responseTime,
                    avgResponseTime: responseTime,
                    errors: res.statusCode >= 400 ? 1 : 0
                };
            }
        } catch (err) {
            console.error('日志中间件错误:', err);
            // 不要让日志错误影响主应用
        }
    };

    next();
}; 