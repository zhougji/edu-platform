const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { check, validationResult } = require('express-validator');
// 使用MySQL存储
const userStore = require('../utils/tempFileUserStore');
const { protect } = require('../middleware/auth');
const dotenv = require('dotenv');

// 加载环境变量
dotenv.config();

// JWT secret
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret';

// POST /api/auth/register - 用户注册
router.post('/register', async (req, res) => {
    console.log('[POST /api/auth/register] 收到请求体:', req.body);
    try {
        const { name, contactType, contact, password, role, realName, subject, description } = req.body;
        console.log('[POST /api/auth/register] 解析出的字段:', { name, contactType, contact, password, role });

        if (!name || !contactType || !contact || !password) {
            console.log('[POST /api/auth/register] 验证失败: 缺少必填字段');
            return res.status(400).json({ success: false, message: '请提供所有必填信息' });
        }
        if (role && role !== 'student' && role !== 'teacher') {
            console.log('[POST /api/auth/register] 验证失败: 角色类型无效');
            return res.status(400).json({ success: false, message: '角色类型无效' });
        }

        console.log(`[POST /api/auth/register] 检查用户是否存在: ${contactType}=${contact}`);
        const exists = await userStore.userExists(contactType, contact);
        if (exists) {
            console.log('[POST /api/auth/register] 验证失败: 该联系方式已被注册');
            return res.status(400).json({ success: false, message: '该联系方式已被注册' });
        }

        const userData = { name, role: role || 'student', password, contact, contactType };
        if (userData.role === 'teacher') {
            userData.realName = realName || '';
            userData.subject = subject || '';
            userData.description = description || '';
        }

        console.log('[POST /api/auth/register] 准备创建用户，数据:', userData);
        const newUser = await userStore.createUser(userData);

        if (!newUser) {
            console.log('[POST /api/auth/register] 用户创建失败');
            return res.status(500).json({ success: false, message: '用户创建失败' });
        }
        console.log('[POST /api/auth/register] 用户创建成功，ID:', newUser.id);

        // 注册成功后，直接返回成功信息，让用户去登录获取 token
        // 或者也可以选择在这里直接生成 token 并返回
        res.status(201).json({
            success: true,
            message: '注册成功，请登录',
            user: newUser // 返回创建的用户信息 (无密码)
        });

        /* // 如果希望注册后直接登录，取消注释以下代码
        const token = jwt.sign({ id: newUser.id }, JWT_SECRET, { expiresIn: '30d' });
        await userStore.addTokenToUser(newUser.id, token);
        res.status(201).json({ success: true, token, user: newUser });
        */

    } catch (error) {
        console.error('[POST /api/auth/register] 捕获到未知错误:', error);
        res.status(500).json({ success: false, message: '服务器错误' });
    }
});

// POST /api/auth/login - 用户登录
router.post('/login', async (req, res) => {
    console.log('[POST /api/auth/login] 收到请求体:', req.body);
    try {
        const { contactType, contact, password, role } = req.body;
        if (!contactType || !contact || !password) {
            return res.status(400).json({ success: false, message: '请提供完整的登录信息' });
        }

        const user = await userStore.findUserByCredential(contactType, contact);
        if (!user) {
            return res.status(401).json({ success: false, message: '登录失败，用户不存在' });
        }
        if (role && user.role !== role) {
            return res.status(401).json({ success: false, message: '登录失败，用户角色不匹配' });
        }

        const isValidPassword = await userStore.verifyPassword(password, user.password);
        if (!isValidPassword) {
            return res.status(401).json({ success: false, message: '登录失败，密码错误' });
        }

        const token = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: '30d' });
        await userStore.addTokenToUser(user.id, token);

        // 更新用户最后活跃时间
        await userStore.updateUser(user.id, { lastActive: new Date() });

        const { password: _, tokens, ...userWithoutSensitiveInfo } = user;
        console.log('[POST /api/auth/login] 登录成功, 用户:', userWithoutSensitiveInfo.id);
        res.json({ success: true, token, user: userWithoutSensitiveInfo });

    } catch (error) {
        console.error('[POST /api/auth/login] 登录错误:', error);
        res.status(500).json({ success: false, message: '服务器错误' });
    }
});

// POST /api/auth/logout - 用户登出
router.post('/logout', protect, async (req, res) => {
    console.log(`[POST /api/auth/logout] 用户 ${req.user.id} 登出`);
    try {
        // protect 中间件已经验证了 token 并附加了 req.user 和 req.token
        await userStore.removeTokenFromUser(req.user.id, req.token);
        res.json({ success: true, message: '登出成功' });
    } catch (error) {
        console.error('[POST /api/auth/logout] 登出错误:', error);
        res.status(500).json({ success: false, message: '服务器错误' });
    }
});

// 注意：GET /api/auth/me 路由现在移动到了 /api/users/me (由 userRoutes.js 处理)

module.exports = router; 