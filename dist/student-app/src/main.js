import Vue from 'vue'
import App from './App.vue'
import router from './router'
import store from './store' // Assuming Vuex store
import ElementUI from 'element-ui'
import 'element-ui/lib/theme-chalk/index.css'
import axios from 'axios'
import { setupAuthInterceptor } from './utils/auth'

Vue.config.productionTip = false

// Use Element UI
Vue.use(ElementUI)

// Configure Axios
const axiosInstance = axios.create({
    baseURL: '/api'
})

// 设置认证拦截器
setupAuthInterceptor(axiosInstance)

// 添加请求拦截器用于调试
axiosInstance.interceptors.request.use(request => {
    console.log('API 请求:', request.method, request.url, request.params || request.data);
    return request;
});

// 添加响应拦截器用于调试
axiosInstance.interceptors.response.use(
    response => {
        console.log('API 响应成功:', response.config.url, response.status);
        return response;
    },
    error => {
        console.error('API 响应错误:', error.config?.url, error.response?.status, error.message);
        return Promise.reject(error);
    }
);

// 全局注册axios实例
Vue.prototype.$http = axiosInstance

// Set auth token if available
const token = localStorage.getItem('studentToken')
if (token) {
    axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${token}`
}

new Vue({
    router,
    store, // Include store if using Vuex
    render: h => h(App)
}).$mount('#app') 