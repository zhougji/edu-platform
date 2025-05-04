import api, { API_CONFIG } from './apiService';

/**
 * Sends a message to the backend AI chat endpoint.
 *
 * @param {string} message The user's message.
 * @param {Array<object>} history The current chat history (optional). 
 * @returns {Promise<string>} A promise that resolves with the AI's response text.
 */
export const sendMessageToAI = async (message, history = []) => {
    try {
        console.log('Sending AI message:', message);
        let response;

        // 检查用户是否已登录
        const isLoggedIn = !!(localStorage.getItem('auth_token') || localStorage.getItem('token') || localStorage.getItem('studentToken'));

        if (isLoggedIn) {
            console.log('用户已登录，使用认证的AI接口');
            // 使用需要认证的API接口
            response = await api.ai.sendAuthenticatedQuery(message);

            // 已认证接口的响应格式可能不同
            if (response.data && response.data.response) {
                return response.data.response;
            }
        } else {
            console.log('用户未登录，使用匿名AI接口');
            // 使用不需要认证的API接口
            response = await api.ai.sendQuery(message);

            // 检查响应结构
            if (response.data && response.data.aiResponse) {
                return response.data.aiResponse;
            }
        }

        // 如果没有找到预期的响应格式
        console.warn('Unexpected API response format:', response.data);
        return '无法获取AI回复，响应格式不正确，请稍后再试';

    } catch (error) {
        console.error('AI服务错误详情:', error);

        const errorMessage = error.response?.data?.message ||
            error.message ||
            '与AI助手通信失败，请检查网络连接和后端服务状态。';
        throw new Error(errorMessage);
    }
};

/**
 * 测试与后端AI服务的连接状态
 * @returns {Promise<boolean>} 如果连接成功返回true，否则返回false
 */
export const testAIServiceConnection = async () => {
    try {
        console.log('Testing backend connection...');

        // 检查用户是否已登录
        const isLoggedIn = !!(localStorage.getItem('auth_token') || localStorage.getItem('token') || localStorage.getItem('studentToken'));

        if (isLoggedIn) {
            // 对于已登录用户，可以用一个简单的查询来测试AI服务
            try {
                const response = await api.ai.sendAuthenticatedQuery('test', 'General');
                console.log('Authenticated connection test result:', response.data);
                return true;
            } catch (authError) {
                console.warn('Authenticated API test failed, falling back to public API test');
                // 如果认证接口失败，回退到公共接口测试
                const fallbackResponse = await api.ai.testConnection();
                return !!fallbackResponse;
            }
        } else {
            // 未登录用户使用公共测试端点
            const response = await api.ai.testConnection();
            console.log('Connection test result:', response.data);
            return true;
        }
    } catch (error) {
        console.error('Connection test failed:', error);
        return false;
    }
};

/**
 * 获取API配置
 * @returns {Object} API配置对象
 */
export const getApiConfig = () => {
    return { ...API_CONFIG }; // 返回副本
};

// You can add other AI-related API calls here in the future 