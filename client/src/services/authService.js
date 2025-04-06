import axios from 'axios';

const API_URL = '/api/auth';

// 设置请求拦截器，添加认证令牌
axios.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// 登录 - 密码方式
export const login = async (contactType, contact, password) => {
    try {
        const response = await axios.post(`${API_URL}/login`, {
            contactType,
            contact,
            password
        });

        // 存储用户信息和令牌
        localStorage.setItem('user', JSON.stringify(response.data.user));
        localStorage.setItem('token', response.data.token);

        return response.data;
    } catch (error) {
        throw new Error(
            error.response?.data?.error || '登录失败，请检查您的凭据'
        );
    }
};

// 登录 - 验证码方式
export const loginWithVerification = async (contactType, contact, verificationCode) => {
    try {
        const response = await axios.post(`${API_URL}/login/verification`, {
            contactType,
            contact,
            verificationCode
        });

        // 存储用户信息和令牌
        localStorage.setItem('user', JSON.stringify(response.data.user));
        localStorage.setItem('token', response.data.token);

        return response.data;
    } catch (error) {
        throw new Error(
            error.response?.data?.error || '登录失败，验证码可能无效或已过期'
        );
    }
};

// 注册
export const register = async (
    name,
    contactType,
    contact,
    verificationCode,
    password,
    role
) => {
    try {
        const response = await axios.post(`${API_URL}/register`, {
            name,
            contactType,
            contact,
            verificationCode,
            password,
            role
        });

        // 存储用户信息和令牌
        localStorage.setItem('user', JSON.stringify(response.data.user));
        localStorage.setItem('token', response.data.token);

        return response.data;
    } catch (error) {
        throw new Error(
            error.response?.data?.error || '注册失败，请稍后重试'
        );
    }
};

// 登出
export const logout = async () => {
    try {
        await axios.post(`${API_URL}/logout`);

        // 清除本地存储的用户信息和令牌
        localStorage.removeItem('user');
        localStorage.removeItem('token');

        return { success: true };
    } catch (error) {
        throw new Error(
            error.response?.data?.error || '登出失败'
        );
    }
};

// 从localStorage获取当前用户信息
export const getCurrentUser = () => {
    try {
        const token = localStorage.getItem('token');
        if (!token) return null;

        // 这里简单返回一个临时用户对象用于测试
        // 实际应用中应解析JWT并获取真实用户信息
        return {
            id: '1',
            name: '测试用户',
            role: 'student'
        };
    } catch (error) {
        console.error('获取当前用户失败:', error);
        return null;
    }
};

// 更新用户资料
export const updateProfile = async (profileData) => {
    try {
        const response = await axios.patch(`${API_URL}/profile`, profileData);

        // 更新本地存储的用户信息
        localStorage.setItem('user', JSON.stringify(response.data));

        return response.data;
    } catch (error) {
        throw new Error(
            error.response?.data?.error || '更新资料失败'
        );
    }
};

// 教师实名认证
export const teacherVerification = async (verificationData) => {
    try {
        const response = await axios.post(
            `${API_URL}/teacher/verify`,
            verificationData
        );

        return response.data;
    } catch (error) {
        throw new Error(
            error.response?.data?.error || '提交认证信息失败'
        );
    }
}; 