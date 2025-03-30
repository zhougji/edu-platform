const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');
const AIQuestion = require('../models/AIQuestion');
const { protect, verifiedOnly } = require('../middleware/auth');
const {
    answerStudentQuestion,
    generateLearningRecommendations
} = require('../utils/deepseekAI');

/**
 * @route   POST /api/ai-learning/ask
 * @desc    向AI提问并获取回答
 * @access  Private
 */
router.post(
    '/ask',
    [
        protect,
        verifiedOnly,
        [
            check('question', '问题是必需的').not().isEmpty(),
            check('subject', '学科是必需的').not().isEmpty(),
            check('grade', '年级是必需的').not().isEmpty()
        ]
    ],
    async (req, res) => {
        // 验证输入
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                errors: errors.array()
            });
        }

        try {
            const { question, subject, grade } = req.body;

            // 调用DeepSeek AI获取回答
            const startTime = Date.now();
            const aiResponse = await answerStudentQuestion(question, subject, grade);
            const processingTime = Date.now() - startTime;

            // 创建问答记录
            const aiQuestion = new AIQuestion({
                user: req.user._id,
                question,
                answer: aiResponse.content,
                subject,
                model: aiResponse.model || 'deepseek-r1',
                promptTokens: aiResponse.promptTokens || 0,
                completionTokens: aiResponse.completionTokens || 0,
                totalTokens: aiResponse.totalTokens || 0,
                processingTime
            });

            // 保存记录
            await aiQuestion.save();

            res.json({
                success: true,
                id: aiQuestion._id,
                question: aiQuestion.question,
                answer: aiQuestion.answer,
                metadata: {
                    model: aiQuestion.model,
                    promptTokens: aiQuestion.promptTokens,
                    completionTokens: aiQuestion.completionTokens,
                    totalTokens: aiQuestion.totalTokens,
                    processingTime: aiQuestion.processingTime
                }
            });
        } catch (error) {
            console.error('AI回答错误:', error);
            res.status(500).json({
                success: false,
                message: 'AI服务暂时不可用，请稍后再试',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    }
);

/**
 * @route   GET /api/ai-learning/recommendations/:id
 * @desc    获取AI学习建议
 * @access  Private
 */
router.get('/recommendations/:id', [protect, verifiedOnly], async (req, res) => {
    try {
        // 查找问题记录
        const aiQuestion = await AIQuestion.findById(req.params.id);

        if (!aiQuestion) {
            return res.status(404).json({
                success: false,
                message: '找不到该问题记录'
            });
        }

        // 权限检查 - 只有提问者或教师可以查看
        if (
            aiQuestion.user.toString() !== req.user._id.toString() &&
            req.user.role !== 'teacher' &&
            req.user.role !== 'admin'
        ) {
            return res.status(403).json({
                success: false,
                message: '您没有权限查看此内容'
            });
        }

        // 获取学习建议
        const recommendations = await generateLearningRecommendations(
            aiQuestion.question,
            aiQuestion.answer
        );

        res.json({
            success: true,
            id: aiQuestion._id,
            question: aiQuestion.question,
            recommendations: recommendations.recommendations,
            metadata: recommendations.metadata
        });
    } catch (error) {
        console.error('获取学习建议错误:', error);
        res.status(500).json({
            success: false,
            message: '服务器错误',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

/**
 * @route   GET /api/ai-learning/history
 * @desc    获取用户的AI问答历史
 * @access  Private
 */
router.get('/history', [protect, verifiedOnly], async (req, res) => {
    try {
        // 分页参数
        const { page = 1, limit = 10, subject } = req.query;

        // 构建查询条件
        const query = { user: req.user._id };
        if (subject) {
            query.subject = subject;
        }

        // 计算总数和分页
        const total = await AIQuestion.countDocuments(query);
        const questions = await AIQuestion.find(query)
            .sort({ createdAt: -1 })
            .skip((parseInt(page) - 1) * parseInt(limit))
            .limit(parseInt(limit));

        res.json({
            success: true,
            count: questions.length,
            total,
            pages: Math.ceil(total / parseInt(limit)),
            page: parseInt(page),
            questions
        });
    } catch (error) {
        console.error('获取AI问答历史错误:', error);
        res.status(500).json({
            success: false,
            message: '服务器错误',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

/**
 * @route   GET /api/ai-learning/:id
 * @desc    获取特定问答记录详情
 * @access  Private
 */
router.get('/:id', [protect, verifiedOnly], async (req, res) => {
    try {
        const aiQuestion = await AIQuestion.findById(req.params.id)
            .populate('relatedQuestions', 'question')
            .populate('relatedResources', 'title type');

        if (!aiQuestion) {
            return res.status(404).json({
                success: false,
                message: '找不到该问题记录'
            });
        }

        // 权限检查 - 只有提问者或教师可以查看
        if (
            aiQuestion.user.toString() !== req.user._id.toString() &&
            req.user.role !== 'teacher' &&
            req.user.role !== 'admin'
        ) {
            return res.status(403).json({
                success: false,
                message: '您没有权限查看此内容'
            });
        }

        res.json({
            success: true,
            question: aiQuestion
        });
    } catch (error) {
        console.error('获取问答记录错误:', error);
        res.status(500).json({
            success: false,
            message: '服务器错误',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

/**
 * @route   POST /api/ai-learning/:id/feedback
 * @desc    提交对AI回答的反馈
 * @access  Private
 */
router.post(
    '/:id/feedback',
    [
        protect,
        verifiedOnly,
        check('helpful', '请提供有用性评价').isBoolean()
    ],
    async (req, res) => {
        // 验证输入
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                errors: errors.array()
            });
        }

        try {
            const aiQuestion = await AIQuestion.findById(req.params.id);

            if (!aiQuestion) {
                return res.status(404).json({
                    success: false,
                    message: '找不到该问题记录'
                });
            }

            // 权限检查 - 只有提问者可以提供反馈
            if (aiQuestion.user.toString() !== req.user._id.toString()) {
                return res.status(403).json({
                    success: false,
                    message: '您没有权限提交此反馈'
                });
            }

            // 更新反馈
            const { helpful, comments } = req.body;
            aiQuestion.feedback = {
                helpful,
                comments: comments || ''
            };

            await aiQuestion.save();

            res.json({
                success: true,
                message: '反馈提交成功',
                feedback: aiQuestion.feedback
            });
        } catch (error) {
            console.error('提交反馈错误:', error);
            res.status(500).json({
                success: false,
                message: '服务器错误',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    }
);

/**
 * @route   GET /api/ai-learning/subjects/:subject/keywords
 * @desc    获取特定学科的热门关键词
 * @access  Public
 */
router.get('/subjects/:subject/keywords', async (req, res) => {
    try {
        const { subject } = req.params;

        // 聚合查询获取关键词
        const keywords = await AIQuestion.aggregate([
            { $match: { subject } },
            { $unwind: '$keywords' },
            { $group: { _id: '$keywords', count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 20 }
        ]);

        res.json({
            success: true,
            subject,
            keywords: keywords.map(k => ({ keyword: k._id, count: k.count }))
        });
    } catch (error) {
        console.error('获取关键词错误:', error);
        res.status(500).json({
            success: false,
            message: '服务器错误',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

module.exports = router; 