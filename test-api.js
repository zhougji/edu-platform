const axios = require('axios');

// 测试AI API的基本功能
async function testAiApi() {
    console.log('===== 开始测试AI API =====');

    try {
        // 1. 测试连接状态
        console.log('测试 /api/ai/test 端点...');
        const testResponse = await axios.get('http://localhost:8085/api/ai/test');
        console.log('测试响应:', testResponse.data);
        console.log('测试端点成功!\n');

        // 2. 测试AI交互
        console.log('测试 /api/ai/interactions 端点...');
        const payload = {
            studentQuery: "测试消息",
            subject: "测试"
        };

        console.log('发送数据:', payload);
        const interactionResponse = await axios.post(
            'http://localhost:8085/api/ai/interactions',
            payload,
            {
                headers: {
                    'Content-Type': 'application/json'
                }
            }
        );

        console.log('交互响应:', interactionResponse.data);
        console.log('交互测试成功!\n');

        console.log('===== 所有测试完成 =====');
        console.log('测试结果: 成功 ✅');
    } catch (error) {
        console.error('===== 测试失败 =====');
        if (error.response) {
            console.error('状态码:', error.response.status);
            console.error('响应数据:', error.response.data);
        } else if (error.request) {
            console.error('无响应。可能是CORS问题或后端服务未运行。');
            console.error(error.message);
        } else {
            console.error('请求配置错误:', error.message);
        }
        console.error('测试结果: 失败 ❌');
    }
}

// 运行测试
testAiApi(); 