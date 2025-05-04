// 认证相关工具函数
const TOKEN_KEY = 'token';
const USER_KEY = 'user';
const AUTH_TOKEN_KEY = 'auth_token';
const CURRENT_USER_KEY = 'currentUser';

// 保存用户登录信息
export const setAuth = (token, user) => {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
};

// 清除登录信息
export const clearAuth = () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem(AUTH_TOKEN_KEY);
    localStorage.removeItem(CURRENT_USER_KEY);
};

// 获取token
export const getToken = () => {
    // 优先尝试获取auth_token（来自login.html）
    return localStorage.getItem(AUTH_TOKEN_KEY) || localStorage.getItem(TOKEN_KEY);
};

// 获取当前用户信息
export const getUser = () => {
    // 优先尝试获取currentUser（来自login.html）
    const currentUserStr = localStorage.getItem(CURRENT_USER_KEY);
    const userStr = localStorage.getItem(USER_KEY);

    // 尝试解析currentUser
    if (currentUserStr) {
        try {
            return JSON.parse(currentUserStr);
        } catch (e) {
            console.error('解析currentUser失败:', e);
        }
    }

    // 如果没有currentUser或解析失败，尝试解析user
    if (userStr) {
        try {
            return JSON.parse(userStr);
        } catch (e) {
            console.error('解析user失败:', e);
            return null;
        }
    }

    return null;
};

// 是否已登录
export const isAuthenticated = () => {
    const token = getToken();
    const user = getUser();
    return !!token && !!user;
};

// 验证用户角色是否匹配
export const isStudentUser = () => {
    const user = getUser();
    return user && (user.role === 'student' || user.role === 'STUDENT');
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

    axiosInstance.interceptors.response.use(
        (response) => response,
        (error) => {
            if (error.response && (error.response.status === 401 || error.response.status === 403)) {
                // 登录已过期或无权限，跳转到登录页
                clearAuth();
                window.location.href = '/login.html';
            }
            return Promise.reject(error);
        }
    );
}; 