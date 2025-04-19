import Vue from 'vue'
import App from './App.vue'
import router from './router'
import store from './store' // Assuming Vuex store
import ElementUI from 'element-ui'
import 'element-ui/lib/theme-chalk/index.css'
import axios from 'axios'

Vue.config.productionTip = false

// Use Element UI
Vue.use(ElementUI)

// Configure Axios
Vue.prototype.$axios = axios
// Adjust the base URL for student API endpoints if different from teacher
axios.defaults.baseURL = 'http://localhost:3000/api'

// Set auth token if available
const token = localStorage.getItem('studentToken')
if (token) {
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
}

new Vue({
    router,
    store, // Include store if using Vuex
    render: h => h(App)
}).$mount('#app') 