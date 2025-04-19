const userStore = require('../utils/mysqlUserStore');

// @desc    获取当前登录用户的信息
// @route   GET /api/users/me
// @access  Private
exports.getMe = async (req, res, next) => {
    // req.user 由 protect 中间件在验证 token 时设置
    // 它应该包含了从 userStore.findUserById 查找到的用户信息 (不含密码)
    if (!req.user) {
        return res.status(401).json({ success: false, message: '用户未经过身份验证' });
    }

    // 通常 protect 中间件已经附加了 user 对象 (不含密码)
    // 如果 protect 只附加了 id, 则需要重新查找:
    // const user = userStore.findUserById(req.user.id);
    // if (!user) return res.status(404).json({ success: false, message: '用户未找到' });
    // const { password, tokens, ...userInfo } = user;

    // 假设 protect 附加了完整的 user 对象 (已去除敏感信息)
    res.status(200).json({ success: true, data: req.user });
};

// @desc    更新当前登录用户的基础信息 (例如 name, avatar)
// @route   PUT /api/users/me
// @access  Private
exports.updateMe = async (req, res, next) => {
    const { name, avatar /* 其他允许更新的字段 */ } = req.body;
    const userId = req.user.id;

    console.log(`[PUT /api/users/me] 用户 ${userId} 更新个人资料:`, req.body);

    const updates = { name, avatar };
    // 过滤掉 undefined 的字段
    Object.keys(updates).forEach(key => updates[key] === undefined && delete updates[key]);

    // 不能通过此接口更新密码、角色等敏感信息
    delete updates.password;
    delete updates.role;

    const updatedUser = userStore.updateUser(userId, updates);

    if (!updatedUser) {
        console.error(`[PUT /api/users/me] 更新用户 ${userId} 失败`);
        return res.status(400).json({ success: false, message: '更新失败，或用户未找到' });
    }

    console.log(`[PUT /api/users/me] 用户 ${userId} 资料更新成功`);
    res.status(200).json({ success: true, data: updatedUser });
}; 