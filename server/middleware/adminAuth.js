/**
 * 验证管理员权限的中间件
 * 此中间件应在auth中间件之后使用，确保req.user已存在
 * @param {Object} req - Express请求对象
 * @param {Object} res - Express响应对象
 * @param {Function} next - Express下一步函数
 */
module.exports = function (req, res, next) {
    // 确保用户已通过身份验证
    if (!req.user) {
        return res.status(401).json({ message: '未授权，请先登录' });
    }

    // 检查用户角色
    if (req.user.role !== 'admin') {
        return res.status(403).json({ message: '权限不足，需要管理员权限' });
    }

    // 用户是管理员，允许继续
    next();
}; 