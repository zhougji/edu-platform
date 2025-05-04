import axios from 'axios';

// API基础URL配置
export const API_CONFIG = {
    baseUrl: '',
    timeout: 30000,
    retries: 1
};

// 创建一个预配置的axios实例
const api = axios.create({
    baseURL: API_CONFIG.baseUrl,
    timeout: API_CONFIG.timeout,
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
    }
});

// 请求拦截器 - 添加日志和认证token
api.interceptors.request.use(config => {
    console.log(`API请求: ${config.method.toUpperCase()} ${config.url}`, config.data || {});

    // 自动附加认证token（如果存在）
    const token = localStorage.getItem('auth_token') || localStorage.getItem('token') || localStorage.getItem('studentToken');
    if (token) {
        config.headers['Authorization'] = `Bearer ${token}`;
    }

    return config;
}, error => {
    console.error('API请求错误:', error);
    return Promise.reject(error);
});

// 响应拦截器 - 添加日志和错误处理
api.interceptors.response.use(response => {
    console.log(`API响应: ${response.status}`, response.data);
    return response;
}, error => {
    if (error.response) {
        console.error(`API错误: ${error.response.status}`, error.response.data);

        // 如果是401错误且有token，可能是token过期，尝试清除
        if (error.response.status === 401) {
            const hasToken = localStorage.getItem('auth_token') || localStorage.getItem('token') || localStorage.getItem('studentToken');
            if (hasToken) {
                console.warn('收到401错误且存在token，可能是登录会话已过期');
            }
        }
    } else if (error.request) {
        console.error('没有收到响应', error.request);
    } else {
        console.error('请求配置错误', error.message);
    }
    return Promise.reject(error);
});

// API方法
export default {
    // AI相关
    ai: {
        // 测试AI服务连接
        testConnection() {
            return api.get('/api/ai/test');
        },

        // 未登录用户的AI查询
        sendQuery(query, subject = 'General') {
            return api.post('/api/ai/interactions', {
                studentQuery: query,
                subject: subject
            });
        },

        // 已登录用户的AI查询 - 使用认证接口
        sendAuthenticatedQuery(query, subject = 'General') {
            return api.post('/api/ai-learning/quick-query', {
                query: query,
                subject: subject
            });
        }
    },

    // 用户相关
    user: {
        // 获取用户资料
        getProfile() {
            return api.get('/api/user/profile');
        }
    },

    // 资源相关
    resources: {
        // 获取视频资源
        getVideos() {
            return api.get('/api/resources/videos');
        }
    }
}; 