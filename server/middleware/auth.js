const jwt = require('jsonwebtoken');
const userStore = require('../utils/tempFileUserStore');
const dotenv = require('dotenv');

// 加载环境变量
dotenv.config();

// JWT secret 从环境变量中获取
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret';

/**
 * 保护路由的中间件
 * 验证 JWT token 并将用户信息添加到请求对象
 */
exports.protect = async (req, res, next) => {
    let token;

    // 从 headers 中获取 token
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    }

    // 检查 token 是否存在
    if (!token) {
        return res.status(401).json({
            success: false,
            message: '未授权访问，请先登录'
        });
    }

    try {
        // 验证 token
        const decoded = jwt.verify(token, JWT_SECRET);

        // 获取用户信息
        const user = await userStore.findUserById(decoded.id);

        if (!user) {
            return res.status(401).json({
                success: false,
                message: '用户不存在或已被删除'
            });
        }

        // 检查 token 是否在用户的有效 token 列表中
        const isValid = await userStore.isValidToken(user.id, token);
        if (!isValid) {
            return res.status(401).json({
                success: false,
                message: 'Token 已失效，请重新登录'
            });
        }

        // 将用户信息和 token 添加到请求对象
        // 从用户对象中移除敏感信息
        const { password, tokens, ...userWithoutSensitiveInfo } = user;
        req.user = userWithoutSensitiveInfo;
        req.token = token;
        next();

    } catch (error) {
        console.error('Token 验证失败:', error);
        // 区分不同的 JWT 错误
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({ success: false, message: '无效的Token' });
        } else if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ success: false, message: 'Token已过期' });
        } else {
            return res.status(401).json({
                success: false,
                message: '身份验证失败，请重新登录'
            });
        }
    }
};

/**
 * 授权中间件
 * 检查用户是否具有指定的角色
 * @param {...string} roles - 允许访问的角色列表
 */
exports.authorize = (...roles) => {
    return (req, res, next) => {
        // protect 中间件应该已经运行，并将 user 信息附加到 req
        if (!req.user || !req.user.role) {
            return res.status(403).json({
                success: false,
                message: '用户角色信息缺失，无法授权'
            });
        }

        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: `角色 (${req.user.role}) 未授权访问此路由`
            });
        }
        next();
    };
}; 