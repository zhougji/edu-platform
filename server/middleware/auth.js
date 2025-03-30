const jwt = require('jsonwebtoken');
const User = require('../models/User');

// 从环境变量获取JWT密钥
const JWT_SECRET = process.env.JWT_SECRET;

/**
 * 保护路由 - 验证用户令牌并添加用户身份
 */
exports.protect = async (req, res, next) => {
    let token;

    // 检查请求头中的Authorization
    if (
        req.headers.authorization &&
        req.headers.authorization.startsWith('Bearer')
    ) {
        // 从Bearer令牌中提取JWT
        token = req.headers.authorization.split(' ')[1];
    }
    // 也可以从cookies中获取JWT
    else if (req.cookies?.token) {
        token = req.cookies.token;
    }

    // 检查是否提供了令牌
    if (!token) {
        return res.status(401).json({
            success: false,
            message: '访问被拒绝，请先登录'
        });
    }

    try {
        // 验证令牌
        const decoded = jwt.verify(token, JWT_SECRET);

        // 获取用户信息
        const user = await User.findById(decoded.id);

        if (!user) {
            return res.status(401).json({
                success: false,
                message: '找不到该用户'
            });
        }

        // 添加用户对象到请求
        req.user = user;
        next();
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                success: false,
                message: '会话已过期，请重新登录'
            });
        }

        return res.status(401).json({
            success: false,
            message: '访问被拒绝，认证无效'
        });
    }
};

/**
 * 授权特定角色访问
 */
exports.authorize = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: `用户角色 ${req.user.role} 没有权限访问此资源`
            });
        }
        next();
    };
};

/**
 * 验证用户是否已验证邮箱
 */
exports.verifiedOnly = (req, res, next) => {
    if (!req.user.isEmailVerified) {
        return res.status(403).json({
            success: false,
            message: '请先验证您的邮箱后再访问此资源'
        });
    }
    next();
};

/**
 * 生成JWT令牌
 */
exports.generateToken = (userId) => {
    return jwt.sign({ id: userId }, JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRE || '7d'
    });
};

/**
 * 限制请求速率（简单实现）
 */
const requestCounts = {};
const REQUEST_WINDOW = 60 * 1000; // 1分钟时间窗口
const MAX_REQUESTS = 60; // 每个IP每分钟最大请求数

exports.rateLimiter = (req, res, next) => {
    const ip = req.ip;
    const now = Date.now();

    // 初始化或清理过期记录
    if (!requestCounts[ip] || now - requestCounts[ip].windowStart > REQUEST_WINDOW) {
        requestCounts[ip] = {
            count: 1,
            windowStart: now
        };
        return next();
    }

    // 增加计数
    requestCounts[ip].count++;

    // 检查是否超过限制
    if (requestCounts[ip].count > MAX_REQUESTS) {
        return res.status(429).json({
            success: false,
            message: '请求过于频繁，请稍后再试'
        });
    }

    next();
}; 