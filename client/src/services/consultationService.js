import axios from 'axios';

const API_URL = '/api/consultations';

// 获取教师列表
export const getTeachers = async (params = {}) => {
    try {
        const response = await axios.get(`${API_URL}/teachers`, { params });
        return response.data;
    } catch (error) {
        throw new Error(
            error.response?.data?.message || '获取教师列表失败'
        );
    }
};

// 获取教师详情
export const getTeacherById = async (id) => {
    try {
        const response = await axios.get(`${API_URL}/teachers/${id}`);
        return response.data.data;
    } catch (error) {
        throw new Error(
            error.response?.data?.message || '获取教师详情失败'
        );
    }
};

// 创建咨询请求
export const createConsultation = async (consultationData) => {
    try {
        const response = await axios.post(API_URL, consultationData);
        return response.data.data;
    } catch (error) {
        throw new Error(
            error.response?.data?.message || '创建咨询请求失败'
        );
    }
};

// 获取咨询列表
export const getConsultations = async (params = {}) => {
    try {
        const response = await axios.get(API_URL, { params });
        return response.data;
    } catch (error) {
        throw new Error(
            error.response?.data?.message || '获取咨询列表失败'
        );
    }
};

// 获取咨询详情
export const getConsultationById = async (id) => {
    try {
        const response = await axios.get(`${API_URL}/${id}`);
        return response.data.data;
    } catch (error) {
        throw new Error(
            error.response?.data?.message || '获取咨询详情失败'
        );
    }
};

// 更新咨询状态（教师使用）
export const updateConsultationStatus = async (id, status) => {
    try {
        const response = await axios.put(`${API_URL}/${id}/status`, { status });
        return response.data.data;
    } catch (error) {
        throw new Error(
            error.response?.data?.message || '更新咨询状态失败'
        );
    }
};

// 发送咨询消息
export const sendConsultationMessage = async (id, content) => {
    try {
        const response = await axios.post(`${API_URL}/${id}/messages`, { content });
        return response.data.data;
    } catch (error) {
        throw new Error(
            error.response?.data?.message || '发送消息失败'
        );
    }
};

// 提交咨询反馈（学生使用）
export const submitConsultationFeedback = async (id, feedbackData) => {
    try {
        const response = await axios.post(`${API_URL}/${id}/feedback`, feedbackData);
        return response.data.data;
    } catch (error) {
        throw new Error(
            error.response?.data?.message || '提交反馈失败'
        );
    }
};

// 取消咨询请求（学生使用）
export const cancelConsultation = async (id) => {
    try {
        const response = await axios.delete(`${API_URL}/${id}`);
        return response.data;
    } catch (error) {
        throw new Error(
            error.response?.data?.message || '取消咨询请求失败'
        );
    }
}; 