import Vue from 'vue'
import App from './App.vue'
import router from './router'
import ElementUI from 'element-ui'
import 'element-ui/lib/theme-chalk/index.css'
import axios from 'axios'

Vue.config.productionTip = false
Vue.use(ElementUI)

// Add axios to Vue prototype for easy access
Vue.prototype.$axios = axios
axios.defaults.baseURL = 'http://localhost:3000/api'

// Set auth token if available
const token = localStorage.getItem('auth_token')
if (token) {
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
}

// Add navigation guards to check authentication
router.beforeEach((to, from, next) => {
    const isAuthenticated = !!localStorage.getItem('auth_token')
    const requiresAuth = to.matched.some(record => record.meta.requiresAuth !== false)

    if (requiresAuth && !isAuthenticated) {
        // Redirect to login page if not authenticated
        window.location.href = '/login.html'
    } else {
        next()
    }
})

new Vue({
    router,
    render: h => h(App)
}).$mount('#app') 