import axios from 'axios';

const API_URL = '/api/resources';

// 获取资源列表（带筛选和搜索）
export const getResources = async (params = {}) => {
    try {
        const response = await axios.get(API_URL, { params });
        return response.data;
    } catch (error) {
        throw new Error(
            error.response?.data?.message || '获取资源列表失败'
        );
    }
};

// 获取单个资源详情
export const getResourceById = async (id) => {
    try {
        const response = await axios.get(`${API_URL}/${id}`);
        return response.data.data;
    } catch (error) {
        throw new Error(
            error.response?.data?.message || '获取资源详情失败'
        );
    }
};

// 获取学科列表
export const getSubjects = async () => {
    try {
        const response = await axios.get(`${API_URL}/subjects`);
        return response.data.data;
    } catch (error) {
        throw new Error(
            error.response?.data?.message || '获取学科列表失败'
        );
    }
};

// 获取年级列表
export const getGrades = async () => {
    try {
        const response = await axios.get(`${API_URL}/grades`);
        return response.data.data;
    } catch (error) {
        throw new Error(
            error.response?.data?.message || '获取年级列表失败'
        );
    }
};

// 获取资源类型列表
export const getResourceTypes = async () => {
    try {
        const response = await axios.get(`${API_URL}/types`);
        return response.data.data;
    } catch (error) {
        throw new Error(
            error.response?.data?.message || '获取资源类型列表失败'
        );
    }
};

// 上传新资源（教师使用）
export const createResource = async (resourceData) => {
    try {
        const response = await axios.post(API_URL, resourceData);
        return response.data.data;
    } catch (error) {
        throw new Error(
            error.response?.data?.message || '创建资源失败'
        );
    }
};

// 更新资源（教师使用）
export const updateResource = async (id, resourceData) => {
    try {
        const response = await axios.put(`${API_URL}/${id}`, resourceData);
        return response.data.data;
    } catch (error) {
        throw new Error(
            error.response?.data?.message || '更新资源失败'
        );
    }
};

// 删除资源（教师使用）
export const deleteResource = async (id) => {
    try {
        const response = await axios.delete(`${API_URL}/${id}`);
        return response.data;
    } catch (error) {
        throw new Error(
            error.response?.data?.message || '删除资源失败'
        );
    }
}; 