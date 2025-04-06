const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');
const AiChat = require('../models/AiChat');
const { protect, authorize } = require('../middleware/auth');
const config = require('../config/config');
const axios = require('axios');

// OpenAI API配置
const OPENAI_API_KEY = config.OPENAI_API_KEY;
const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';

/**
 * @route   POST /api/ai/chat
 * @desc    创建新的AI对话或向现有对话发送消息
 * @access  Private (需要学生权限)
 */
router.post(
    '/chat',
    [
        protect,
        authorize('student'),
        check('message', '消息不能为空').notEmpty(),
        check('chatId', '如果提供chatId，必须是有效ID').optional()
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                errors: errors.array()
            });
        }

        try {
            const { message, chatId, subject } = req.body;
            let chat;

            // 如果提供了chatId，查找现有对话
            if (chatId) {
                chat = await AiChat.findById(chatId);

                // 验证对话存在且属于当前用户
                if (!chat || chat.student.toString() !== req.user.id) {
                    return res.status(404).json({
                        success: false,
                        message: '对话不存在或无访问权限'
                    });
                }
            } else {
                // 创建新对话
                chat = new AiChat({
                    student: req.user.id,
                    subject: subject || '通用',
                    messages: []
                });
            }

            // 添加用户消息
            chat.messages.push({
                role: 'user',
                content: message,
                timestamp: Date.now()
            });

            // 准备发送到OpenAI的消息
            const messagesForAI = chat.messages.map(m => ({
                role: m.role,
                content: m.content
            }));

            // 添加系统消息指示AI的角色
            messagesForAI.unshift({
                role: 'system',
                content: '你是一位专业、友好的教育助手，名为"启明助手"。你的目标是帮助中国中小学生解答问题、提供学习指导和建议。请提供准确、符合学生年龄和教育水平的回答。如果学生提出不适当的问题，请礼貌地拒绝并引导回学习话题。'
            });

            // 调用OpenAI API
            const openaiResponse = await axios.post(
                OPENAI_API_URL,
                {
                    model: 'gpt-3.5-turbo',
                    messages: messagesForAI,
                    max_tokens: 1000,
                    temperature: 0.7
                },
                {
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${OPENAI_API_KEY}`
                    }
                }
            );

            // 获取AI的回复
            const aiReply = openaiResponse.data.choices[0].message.content;

            // 添加AI回复到对话
            chat.messages.push({
                role: 'assistant',
                content: aiReply,
                timestamp: Date.now()
            });

            // 保存对话
            await chat.save();

            res.json({
                success: true,
                data: {
                    chat,
                    aiReply
                }
            });
        } catch (error) {
            console.error('AI对话错误:', error);
            res.status(500).json({
                success: false,
                message: '服务器错误',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    }
);

/**
 * @route   GET /api/ai/chats
 * @desc    获取当前用户的所有AI对话
 * @access  Private (需要学生权限)
 */
router.get('/chats', [protect, authorize('student')], async (req, res) => {
    try {
        const { page = 1, limit = 10 } = req.query;
        const skip = (parseInt(page) - 1) * parseInt(limit);

        // 查询用户的所有对话，按更新时间降序排序
        const chats = await AiChat.find({ student: req.user.id, isActive: true })
            .select('title subject updatedAt')
            .sort({ updatedAt: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        // 获取总数
        const total = await AiChat.countDocuments({
            student: req.user.id,
            isActive: true
        });

        res.json({
            success: true,
            data: chats,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total
            }
        });
    } catch (error) {
        console.error('获取AI对话列表错误:', error);
        res.status(500).json({
            success: false,
            message: '服务器错误',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

/**
 * @route   GET /api/ai/chat/:id
 * @desc    获取单个AI对话详情
 * @access  Private (需要学生权限)
 */
router.get('/chat/:id', [protect, authorize('student')], async (req, res) => {
    try {
        const chat = await AiChat.findById(req.params.id);

        // 验证对话存在且属于当前用户
        if (!chat || chat.student.toString() !== req.user.id || !chat.isActive) {
            return res.status(404).json({
                success: false,
                message: '对话不存在或无访问权限'
            });
        }

        res.json({
            success: true,
            data: chat
        });
    } catch (error) {
        console.error('获取AI对话详情错误:', error);
        res.status(500).json({
            success: false,
            message: '服务器错误',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

/**
 * @route   PUT /api/ai/chat/:id
 * @desc    更新AI对话(标题等)
 * @access  Private (需要学生权限)
 */
router.put(
    '/chat/:id',
    [
        protect,
        authorize('student'),
        check('title', '标题不能为空').optional().notEmpty()
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                errors: errors.array()
            });
        }

        try {
            const { title, subject } = req.body;
            const chat = await AiChat.findById(req.params.id);

            // 验证对话存在且属于当前用户
            if (!chat || chat.student.toString() !== req.user.id || !chat.isActive) {
                return res.status(404).json({
                    success: false,
                    message: '对话不存在或无访问权限'
                });
            }

            // 更新字段
            if (title) chat.title = title;
            if (subject) chat.subject = subject;

            await chat.save();

            res.json({
                success: true,
                data: chat
            });
        } catch (error) {
            console.error('更新AI对话错误:', error);
            res.status(500).json({
                success: false,
                message: '服务器错误',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    }
);

/**
 * @route   DELETE /api/ai/chat/:id
 * @desc    删除AI对话(软删除)
 * @access  Private (需要学生权限)
 */
router.delete('/chat/:id', [protect, authorize('student')], async (req, res) => {
    try {
        const chat = await AiChat.findById(req.params.id);

        // 验证对话存在且属于当前用户
        if (!chat || chat.student.toString() !== req.user.id) {
            return res.status(404).json({
                success: false,
                message: '对话不存在或无访问权限'
            });
        }

        // 软删除
        chat.isActive = false;
        await chat.save();

        res.json({
            success: true,
            data: {},
            message: '对话已删除'
        });
    } catch (error) {
        console.error('删除AI对话错误:', error);
        res.status(500).json({
            success: false,
            message: '服务器错误',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

module.exports = router; 