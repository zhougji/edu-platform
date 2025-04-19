const express = require('express');
const {
    getMe,
    updateMe
} = require('../controllers/userController');
const { protect } = require('../middleware/auth');

const router = express.Router();

// 应用保护中间件到所有用户路由
router.use(protect);

// 定义获取和更新当前用户信息的路由
router.get('/me', getMe);
router.put('/me', updateMe);

module.exports = router; 