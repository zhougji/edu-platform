import Vue from 'vue'
import App from './App.vue'
import router from './router'
import ElementUI from 'element-ui'
import 'element-ui/lib/theme-chalk/index.css'
import axios from 'axios'
import { setupAuthInterceptor } from './utils/auth'

Vue.config.productionTip = false
Vue.use(ElementUI)

// Add axios to Vue prototype for easy access
Vue.prototype.$axios = axios
axios.defaults.baseURL = '/api'

// 获取认证令牌
const getToken = () => {
    return localStorage.getItem('auth_token') ||
        localStorage.getItem('token') ||
        localStorage.getItem('studentToken');
}

// 设置认证令牌（如果存在）
const token = getToken();

// 如果有token，则使用它
if (token) {
    console.log('当前token:', token.substring(0, 10) + '...');
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
} else {
    console.warn('未检测到认证令牌，请确保您已经登录');
}

// Add navigation guards to check authentication
router.beforeEach((to, from, next) => {
    // 只记录路由日志，不再做多余检查
    console.log('路由导航:', { 路径: to.path })
    next()
})

// 创建axios实例
const axiosInstance = axios.create({
    baseURL: process.env.NODE_ENV === 'development' ? 'http://localhost:8085/api' : '/api'
})

// 设置认证拦截器
setupAuthInterceptor(axiosInstance)

// 全局注册axios实例
Vue.prototype.$http = axiosInstance

new Vue({
    router,
    render: h => h(App)
}).$mount('#app') 