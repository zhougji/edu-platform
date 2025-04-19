const express = require('express');
const {
    processAiChat
} = require('../controllers/aiController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// 定义 AI 聊天路由 (学生)
router.post('/chat', protect, authorize('student'), processAiChat);

module.exports = router; 