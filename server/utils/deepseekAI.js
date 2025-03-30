const fetch = require('node-fetch');

// DeepSeek API设置
const DEEPSEEK_API_URL = process.env.DEEPSEEK_API_URL || 'https://api.deepseek.com/v1/chat/completions';
const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;
const DEFAULT_MODEL = 'deepseek-chat'; // 或根据DeepSeek提供的具体模型名称更改

/**
 * 发送请求到DeepSeek API
 * @param {Array} messages - 对话消息数组
 * @param {Object} options - 额外选项
 * @returns {Object} DeepSeek API响应
 */
const callDeepSeekAPI = async (messages, options = {}) => {
    try {
        if (!DEEPSEEK_API_KEY) {
            throw new Error('未配置DeepSeek API密钥，请在.env文件中设置DEEPSEEK_API_KEY');
        }

        const startTime = Date.now();

        const response = await fetch(DEEPSEEK_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${DEEPSEEK_API_KEY}`
            },
            body: JSON.stringify({
                model: options.model || DEFAULT_MODEL,
                messages: messages,
                temperature: options.temperature || 0.7,
                max_tokens: options.max_tokens || 2048,
                stream: false
            })
        });

        const endTime = Date.now();
        const processingTime = endTime - startTime;

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`DeepSeek API 错误: ${errorData.error?.message || response.statusText}`);
        }

        const data = await response.json();

        return {
            content: data.choices[0].message.content,
            model: data.model,
            promptTokens: data.usage.prompt_tokens,
            completionTokens: data.usage.completion_tokens,
            totalTokens: data.usage.total_tokens,
            processingTime
        };
    } catch (error) {
        console.error('DeepSeek API 调用失败:', error.message);
        throw error;
    }
};

/**
 * 回答学生的学习问题
 * @param {String} question - 学生的问题
 * @param {String} subject - 问题主题/科目
 * @param {String} grade - 年级
 * @returns {Object} DeepSeek回答和元数据
 */
const answerStudentQuestion = async (question, subject, grade) => {
    const systemPrompt = `你是一名优秀的${subject}教师，专门为${grade}年级学生提供学习辅导和解答问题。
请以清晰、易懂的方式回答学生的问题，使用适合其年级的语言和概念。
如果问题涉及多步骤的解题过程，请逐步展示解题思路和计算过程。
必要时可以提供相关的例子帮助理解，并在回答后提供1-2个相关的练习题帮助学生巩固知识点。`;

    const messages = [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: question }
    ];

    return callDeepSeekAPI(messages, {
        temperature: 0.5 // 降低温度以获得更确定性的回答
    });
};

/**
 * 根据问题生成相关的学习建议
 * @param {String} question - 原始问题
 * @param {String} answer - 已提供的回答
 * @returns {Array} 学习建议和相关资源
 */
const generateLearningRecommendations = async (question, answer) => {
    const systemPrompt = `基于学生的问题和已提供的回答，提供个性化的学习建议。
建议应包括：
1. 与问题相关的3个关键知识点
2. 学习这些知识点的建议方法或资源
3. 可能对学生有帮助的2-3个相关主题`;

    const messages = [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `问题: ${question}\n\n回答: ${answer}` }
    ];

    const result = await callDeepSeekAPI(messages, {
        temperature: 0.7,
        max_tokens: 1024
    });

    return {
        recommendations: result.content,
        metadata: {
            model: result.model,
            tokens: result.totalTokens,
            processingTime: result.processingTime
        }
    };
};

module.exports = {
    callDeepSeekAPI,
    answerStudentQuestion,
    generateLearningRecommendations
}; 