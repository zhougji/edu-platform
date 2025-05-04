import Vue from 'vue'
import Router from 'vue-router'
// import { isAuthenticated, isStudentUser } from './utils/auth'

// Import Views (Lazy Loading recommended for better performance)
// const Login = () => import('./views/Login.vue')
const Register = () => import('./views/Register.vue')
const StudentHome = () => import('./views/StudentHome.vue')
const OnlineResources = () => import('./views/OnlineResources.vue')
const OnlineConsultation = () => import('./views/OnlineConsultation.vue')
const TeacherProfile = () => import('./views/TeacherProfile.vue')
const AIAssistant = () => import('./views/AIAssistant.vue')
const Profile = () => import('./views/Profile.vue')

Vue.use(Router)

const routes = [
    // --- Authentication Routes --- 
    // {
    //     path: '/login',
    //     name: 'Login',
    //     component: Login,
    //     meta: { requiresAuth: false }
    // },
    {
        path: '/register',
        name: 'Register',
        component: Register
    },
    // --- Student Routes --- 
    {
        path: '/home',
        name: 'StudentHome',
        component: StudentHome
    },
    {
        path: '/',
        redirect: '/home'
    },
    {
        path: '/resources',
        name: 'OnlineResources',
        component: OnlineResources
    },
    {
        path: '/consultation',
        name: 'OnlineConsultation',
        component: OnlineConsultation
    },
    {
        path: '/consultation/teacher/:teacherId',
        name: 'TeacherProfile',
        component: TeacherProfile,
        props: true
    },
    {
        path: '/ai-assistant',
        name: 'AIAssistant',
        component: AIAssistant
    },
    {
        path: '/profile',
        name: 'Profile',
        component: Profile
    },
    // Catch-all route (optional)
    { path: '*', redirect: '/home' }
]

const router = new Router({
    mode: 'history',
    base: process.env.BASE_URL || '/student-app/',
    routes
})

// 移除所有路由守卫，允许直接访问所有页面

export default router 