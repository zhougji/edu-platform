const express = require('express');
const router = express.Router();
const fetch = require('node-fetch');
const auth = require('../middleware/auth');
const Student = require('../models/Student');
const Resource = require('../models/Resource');

// Constants for the ds-r1 model API
const DS_R1_API_URL = process.env.DS_R1_API_URL || 'https://api.deepseek.com/v1/chat/completions';
const DS_R1_API_KEY = process.env.DS_R1_API_KEY;

/**
 * @route   POST /api/ai-learning
 * @desc    Get AI learning suggestions based on student's input
 * @access  Private
 */
router.post('/', auth, async (req, res) => {
    try {
        const { query, context } = req.body;

        if (!query) {
            return res.status(400).json({ message: '请提供学习问题' });
        }

        if (!DS_R1_API_KEY) {
            return res.status(500).json({ message: 'DS_R1_API_KEY environment variable not set' });
        }

        // Prepare the prompt for the ds-r1 model
        const prompt = `作为一位教育助手，请根据以下学生的问题提供教学建议、学习指导或知识解答。
    学生背景信息：${context || '无特定背景信息'}
    学生问题：${query}
    请提供详细、有教育意义且容易理解的回答，适当包含一些学习建议和延伸阅读方向。`;

        // Call the ds-r1 model API
        const response = await fetch(DS_R1_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${DS_R1_API_KEY}`
            },
            body: JSON.stringify({
                model: 'deepseek-chat',
                messages: [
                    { role: 'user', content: prompt }
                ],
                temperature: 0.7,
                max_tokens: 1000
            })
        });

        const data = await response.json();

        if (!response.ok) {
            console.error('DS-R1 API error:', data);
            return res.status(response.status).json({
                message: '模型服务调用失败',
                error: data.error || '未知错误'
            });
        }

        // Extract the AI response
        const aiResponse = data.choices[0].message.content;

        return res.json({ suggestion: aiResponse });
    } catch (error) {
        console.error('AI Learning API error:', error);
        res.status(500).json({ message: '服务器错误', error: error.message });
    }
});

// DS-R1 大模型 API 配置
const DS_R1_API_URL_OLD = process.env.DS_R1_API_URL || 'https://api.example.com/ds-r1/generate';
const DS_R1_API_KEY_OLD = process.env.DS_R1_API_KEY || 'your-api-key';

// AI 学习建议请求处理
router.get('/', async (req, res) => {
    try {
        const { userId } = req.query;

        if (!userId) {
            return res.status(400).json({ message: '缺少必要参数：userId' });
        }

        // 获取学生信息和学习历史
        const student = await Student.findById(userId);
        if (!student) {
            return res.status(404).json({ message: '未找到学生信息' });
        }

        // 分析学习历史，获取学习模式和偏好
        const learningHistory = student.learningHistory || [];
        const subjects = {}; // 学科访问次数统计

        learningHistory.forEach(record => {
            subjects[record.subject] = (subjects[record.subject] || 0) + 1;
        });

        // 找出最常访问的学科
        let preferredSubject = '';
        let maxCount = 0;

        for (const [subject, count] of Object.entries(subjects)) {
            if (count > maxCount) {
                maxCount = count;
                preferredSubject = subject;
            }
        }

        // 获取该学科的推荐资源
        const recommendedResources = await Resource.find({
            subject: preferredSubject,
            isApproved: true
        })
            .sort({ rating: -1 })
            .limit(3);

        // 构建提示词
        const prompt = `
作为一个教育辅助AI，基于以下学生信息生成个性化学习建议：
- 姓名：${student.name}
- 年级/学历：${student.grade || '未知'}
- 擅长学科：${preferredSubject || '暂无数据'}
- 学习历史记录数：${learningHistory.length}
- 最近学习记录：${learningHistory.slice(-3).map(h => `${h.subject}(${new Date(h.viewedAt).toLocaleDateString()})`).join(', ')}

请提供具体的学习建议，包括学习方法、时间管理和推荐资源。建议应该实用、具体且鼓励学生。
`;

        try {
            // 调用 DS-R1 大模型 API
            const response = await fetch(DS_R1_API_URL_OLD, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${DS_R1_API_KEY_OLD}`
                },
                body: JSON.stringify({
                    prompt: prompt,
                    max_tokens: 300,
                    temperature: 0.7,
                })
            });

            const data = await response.json();

            if (!response.ok) {
                console.error('DS-R1 API error:', data);
                return res.status(response.status).json({
                    message: '模型服务调用失败',
                    error: data.error || '未知错误'
                });
            }

            let aiSuggestion = '';

            if (data && data.text) {
                aiSuggestion = data.text;
            } else {
                // 如果 API 调用成功但返回格式不符合预期，使用备用响应
                aiSuggestion = generateFallbackSuggestion(student, preferredSubject, recommendedResources);
            }

            // 记录这次 AI 建议请求到学生历史
            student.aiSuggestions = student.aiSuggestions || [];
            student.aiSuggestions.push({
                suggestion: aiSuggestion.substring(0, 100) + '...', // 只存储前100个字符
                timestamp: new Date()
            });
            await student.save();

            res.json({
                message: aiSuggestion,
                recommendedResources: recommendedResources.map(resource => ({
                    id: resource._id,
                    title: resource.title,
                    subject: resource.subject,
                    type: resource.type
                }))
            });

        } catch (apiError) {
            console.error('DS-R1 API调用失败:', apiError);

            // API调用失败时使用备用响应
            const fallbackSuggestion = generateFallbackSuggestion(student, preferredSubject, recommendedResources);

            res.json({
                message: fallbackSuggestion,
                recommendedResources: recommendedResources.map(resource => ({
                    id: resource._id,
                    title: resource.title,
                    subject: resource.subject,
                    type: resource.type
                }))
            });
        }
    } catch (error) {
        console.error('生成AI学习建议失败:', error);
        res.status(500).json({ message: '服务器错误' });
    }
});

// 生成备用建议内容
function generateFallbackSuggestion(student, preferredSubject, recommendedResources) {
    const subjectDisplayNames = {
        'math': '数学',
        'chinese': '语文',
        'english': '英语',
        'physics': '物理',
        'chemistry': '化学',
        'biology': '生物',
        'history': '历史',
        'geography': '地理',
        'politics': '政治'
    };

    const subjectName = subjectDisplayNames[preferredSubject] || preferredSubject;

    let suggestion = `亲爱的${student.name}同学，`;

    if (preferredSubject) {
        suggestion += `根据您的学习历史，我发现您对${subjectName}很感兴趣。以下是一些学习建议：\n\n`;
        suggestion += `1. 坚持每天学习${subjectName}至少30分钟，养成良好的学习习惯。\n`;
        suggestion += `2. 尝试使用思维导图来整理${subjectName}的知识点，这有助于建立知识体系。\n`;
        suggestion += `3. 学习时可以采用番茄工作法，每25分钟专注学习后休息5分钟。\n\n`;
    } else {
        suggestion += `以下是一些通用的学习建议：\n\n`;
        suggestion += `1. 制定合理的学习计划，每天保持固定的学习时间。\n`;
        suggestion += `2. 尝试不同的学习方法，找到最适合自己的方式。\n`;
        suggestion += `3. 学习时可以采用番茄工作法，每25分钟专注学习后休息5分钟。\n\n`;
    }

    if (recommendedResources && recommendedResources.length > 0) {
        suggestion += `推荐资源：\n`;
        recommendedResources.forEach((resource, index) => {
            suggestion += `- ${resource.title}\n`;
        });
    }

    return suggestion;
}

module.exports = router; 