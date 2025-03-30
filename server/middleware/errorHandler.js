/**
 * 全局错误处理中间件
 */
const errorHandler = (err, req, res, next) => {
    // 控制台记录错误
    console.error('错误:', err);

    // 准备错误响应
    let error = { ...err };
    error.message = err.message;

    // 处理Mongoose错误

    // Mongoose CastError - 无效的ObjectId
    if (err.name === 'CastError') {
        const message = '找不到请求的资源';
        return res.status(404).json({
            success: false,
            message
        });
    }

    // Mongoose ValidationError - 验证错误
    if (err.name === 'ValidationError') {
        const messages = Object.values(err.errors).map(val => val.message);
        return res.status(400).json({
            success: false,
            message: messages.join(', ')
        });
    }

    // Mongoose DuplicateKey - 重复键错误
    if (err.code === 11000) {
        const field = Object.keys(err.keyValue)[0];
        const message = `${field} 已被使用`;
        return res.status(400).json({
            success: false,
            message
        });
    }

    // JWT错误
    if (err.name === 'JsonWebTokenError') {
        return res.status(401).json({
            success: false,
            message: '无效的认证令牌'
        });
    }

    // JWT过期
    if (err.name === 'TokenExpiredError') {
        return res.status(401).json({
            success: false,
            message: '认证令牌已过期'
        });
    }

    // 其他错误
    const statusCode = error.statusCode || 500;
    res.status(statusCode).json({
        success: false,
        message: error.message || '服务器错误',
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
};

module.exports = errorHandler; 