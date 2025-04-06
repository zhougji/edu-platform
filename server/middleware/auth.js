const jwt = require('jsonwebtoken');
const config = require('../config/config');
const User = require('../models/User');

// 从环境变量获取JWT密钥
const JWT_SECRET = process.env.JWT_SECRET;

/**
 * 保护路由 - 验证用户令牌并添加用户身份
 */
const auth = async (req, res, next) => {
    try {
        // 从请求头获取token
        const token = req.header('Authorization').replace('Bearer ', '');
        // 验证token
        const decoded = jwt.verify(token, config.JWT_SECRET);
        // 查找对应用户
        const user = await User.findOne({ _id: decoded._id, 'tokens.token': token });

        if (!user) {
            throw new Error();
        }

        // 将用户和token信息存储到请求对象，供后续路由处理器使用
        req.token = token;
        req.user = user;
        next();
    } catch (error) {
        res.status(401).send({ error: '请先登录' });
    }
};

/**
 * 授权特定角色访问
 */
const checkRole = (role) => {
    return (req, res, next) => {
        if (req.user.role !== role) {
            return res.status(403).send({ error: '无权访问此资源' });
        }
        next();
    };
};

/**
 * 验证用户是否已验证邮箱
 */
const verifiedOnly = (req, res, next) => {
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
const generateToken = (userId) => {
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

const rateLimiter = (req, res, next) => {
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

module.exports = { auth, checkRole, verifiedOnly, generateToken, rateLimiter }; 