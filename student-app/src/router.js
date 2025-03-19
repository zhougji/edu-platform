import { createRouter, createWebHistory } from 'vue-router'
import Home from './components/Home.vue'
import OnlineResources from './components/OnlineResources.vue'
import OnlineConsult from './components/OnlineConsult.vue'
import AiLearning from './components/AiLearning.vue'
import Login from './components/Login.vue'
import Register from './components/Register.vue'
import Profile from './components/Profile.vue'

const routes = [
    { path: '/', name: 'Home', component: Home },
    { path: '/resources', name: 'OnlineResources', component: OnlineResources },
    { path: '/consult', name: 'OnlineConsult', component: OnlineConsult },
    { path: '/ai-learning', name: 'AiLearning', component: AiLearning },
    { path: '/login', name: 'Login', component: Login },
    { path: '/register', name: 'Register', component: Register },
    { path: '/profile', name: 'Profile', component: Profile }
]

const router = createRouter({
    history: createWebHistory(),
    routes
})

export default router
