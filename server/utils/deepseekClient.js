// server/utils/deepseekClient.js
const axios = require('axios');
const dotenv = require('dotenv');

dotenv.config();

const apiKey = process.env.DEEPSEEK_API_KEY;
const apiEndpoint = process.env.DEEPSEEK_API_ENDPOINT;

if (!apiKey || !apiEndpoint) {
    console.error("错误：DeepSeek API 密钥或端点未在 .env 文件中配置！");
}

/**
 * 调用 DeepSeek API 获取回答
 * @param {string} prompt 用户的问题或提示
 * @param {string} model 使用的模型，例如 'deepseek-chat' 或 'deepseek-coder'
 * @returns {Promise<string>} AI生成的回答文本
 */
async function getDeepSeekResponse(prompt, model = 'deepseek-chat') {
    if (!apiKey) {
        throw new Error("DeepSeek API 密钥未配置");
    }

    console.log(`[DeepSeek] 发送请求: 模型=${model}, 提示=...`); // 避免打印完整提示

    try {
        const response = await axios.post(
            apiEndpoint,
            {
                model: model,
                messages: [
                    // 可以根据需要添加系统消息或历史消息
                    // { role: "system", content: "你是一个乐于助人的学习助手。" },
                    { role: "user", content: prompt }
                ],
                // 可以添加其他参数，如 temperature, max_tokens 等
                // temperature: 0.7,
                // max_tokens: 1024,
            },
            {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`
                },
                timeout: 60000 // 设置60秒超时
            }
        );

        console.log(`[DeepSeek] 收到响应`);

        // 检查响应结构并提取回答
        if (response.data && response.data.choices && response.data.choices.length > 0) {
            const aiMessage = response.data.choices[0].message;
            if (aiMessage && aiMessage.content) {
                return aiMessage.content.trim();
            }
        }
        console.error("[DeepSeek] 响应格式无效:", response.data);
        throw new Error("未能从 DeepSeek API 获取有效回答");

    } catch (error) {
        console.error("[DeepSeek] API 调用出错:", error.response ? error.response.data : error.message);
        if (error.response && error.response.status === 401) {
            throw new Error("DeepSeek API 密钥无效或过期");
        } else if (error.response && error.response.status === 429) {
            throw new Error("DeepSeek API 请求频率超限");
        }
        throw new Error("与 DeepSeek API 通信时发生错误");
    }
}

module.exports = { getDeepSeekResponse };