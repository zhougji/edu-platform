import axios from 'axios';

const API_URL = '/api/ai';

// 发送消息到AI助手
export const sendMessage = async (message, chatId = null, subject = null) => {
    try {
        const body = { message };
        if (chatId) body.chatId = chatId;
        if (subject) body.subject = subject;

        const response = await axios.post(`${API_URL}/chat`, body);
        return response.data.data;
    } catch (error) {
        throw new Error(
            error.response?.data?.message || '发送消息失败'
        );
    }
};

// 获取AI会话列表
export const getAiChats = async (page = 1, limit = 10) => {
    try {
        const response = await axios.get(`${API_URL}/chats`, {
            params: { page, limit }
        });
        return response.data;
    } catch (error) {
        throw new Error(
            error.response?.data?.message || '获取对话列表失败'
        );
    }
};

// 获取单个AI会话详情
export const getAiChatById = async (id) => {
    try {
        const response = await axios.get(`${API_URL}/chat/${id}`);
        return response.data.data;
    } catch (error) {
        throw new Error(
            error.response?.data?.message || '获取对话详情失败'
        );
    }
};

// 更新AI会话信息
export const updateAiChat = async (id, data) => {
    try {
        const response = await axios.put(`${API_URL}/chat/${id}`, data);
        return response.data.data;
    } catch (error) {
        throw new Error(
            error.response?.data?.message || '更新对话失败'
        );
    }
};

// 删除AI会话
export const deleteAiChat = async (id) => {
    try {
        const response = await axios.delete(`${API_URL}/chat/${id}`);
        return response.data;
    } catch (error) {
        throw new Error(
            error.response?.data?.message || '删除对话失败'
        );
    }
}; 