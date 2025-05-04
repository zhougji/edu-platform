// 认证相关工具函数
const TOKEN_KEY = 'token';
const USER_KEY = 'user';

// 保存用户登录信息
export const setAuth = (token, user) => {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
};

// 清除登录信息
export const clearAuth = () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem('auth_token');
    localStorage.removeItem('currentUser');
};

// 获取token
export const getToken = () => {
    // 优先尝试从 login.html 跳转时设置的 auth_token
    return localStorage.getItem('auth_token') || localStorage.getItem(TOKEN_KEY);
};

// 获取当前用户信息
export const getUser = () => {
    // 尝试从多个可能的存储位置获取用户信息
    const userStr = localStorage.getItem('currentUser') || localStorage.getItem(USER_KEY) || localStorage.getItem('user');
    if (!userStr) {
        console.warn('未找到用户信息，已检查 currentUser, user 和 USER_KEY');
        return null;
    }

    try {
        const userData = JSON.parse(userStr);
        console.log('成功获取到用户信息:', userData);
        return userData;
    } catch (e) {
        console.error('解析用户信息失败:', e, '原始数据:', userStr);
        return null;
    }
};

// 是否已登录
export const isAuthenticated = () => {
    const token = getToken();
    const user = getUser();
    return !!token && !!user;
};

// 验证用户角色是否匹配
export const isTeacherUser = () => {
    const user = getUser();
    return user && (user.role === 'teacher' || user.role === 'TEACHER');
};

// 添加API请求拦截器的辅助函数
export const setupAuthInterceptor = (axiosInstance) => {
    axiosInstance.interceptors.request.use(
        (config) => {
            const token = getToken();
            if (token) {
                config.headers['Authorization'] = `Bearer ${token}`;
            }
            return config;
        },
        (error) => {
            return Promise.reject(error);
        }
    );

    // 避免仪表盘API 401错误导致无限重定向
    axiosInstance.interceptors.response.use(
        (response) => response,
        (error) => {
            // 只有当不是dashboard相关请求时才重定向
            if (error.response &&
                (error.response.status === 401 || error.response.status === 403) &&
                !error.config.url.includes('/dashboard') &&
                !error.config.url.includes('/consultations')) {
                console.log('认证失败，将重定向', error.config.url);
                clearAuth();
                // 不要立即跳转，避免无限循环
                setTimeout(() => {
                    if (window.location.pathname !== '/') {
                        window.location.href = '/';
                    }
                }, 100);
            }
            return Promise.reject(error);
        }
    );
}; 