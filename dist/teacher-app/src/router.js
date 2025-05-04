import Vue from 'vue'
import Router from 'vue-router'
import { isAuthenticated, isTeacherUser } from './utils/auth'

// Import Views
// const Login = () => import('./views/Login.vue')
// const Register = () => import('./views/Register.vue')
const TeacherHome = () => import('./views/Home.vue')
// Resources组件已不再使用，使用VideoManagement替代
const Consultations = () => import('./views/Consultations.vue')
const Profile = () => import('./views/Profile.vue')
const VideoManagement = () => import('./views/videos/VideoManagement.vue')

Vue.use(Router)

const routes = [
    // --- Commented out Authentication Routes --- 
    // {
    //     path: '/login',
    //     name: 'Login',
    //     component: Login,
    //     meta: { requiresAuth: false } // Or a specific layout for auth
    // },
    // {
    //     path: '/register',
    //     name: 'Register',
    //     component: Register,
    //     meta: { requiresAuth: false }
    // },

    // --- Logged-in Teacher Routes --- 
    {
        path: '/home', // Default route
        name: 'TeacherHome',
        component: TeacherHome,
        meta: { requiresAuth: true } // Require authentication
    },
    {
        path: '/', // Redirect root to home
        redirect: '/home'
    },
    {
        path: '/resources',
        name: 'Resources',
        component: VideoManagement,
        meta: { requiresAuth: true } // Require authentication
    },
    {
        path: '/consultations',
        name: 'Consultations',
        component: Consultations,
        meta: { requiresAuth: true } // Require authentication
    },
    {
        path: '/profile',
        name: 'Profile',
        component: Profile,
        meta: { requiresAuth: true } // Require authentication
    },

    // Catch-all route
    { path: '*', redirect: '/home' }
]

const router = new Router({
    mode: 'history',
    base: process.env.BASE_URL || '/',
    routes
})

// Navigation Guard (Enabled)
router.beforeEach((to, from, next) => {
    console.log('路由守卫检查认证状态:', { 路径: to.path, 是否需要认证: to.matched.some(record => record.meta.requiresAuth) });

    // 检查是否需要认证
    if (to.matched.some(record => record.meta.requiresAuth)) {
        // 检查用户是否已登录
        if (!isAuthenticated()) {
            console.log('用户未认证，重定向到登录页');
            // 未登录则跳转到统一登录页
            window.location.href = '/login.html';
            return;
        } else {
            // 检查是否是教师用户
            if (to.matched.some(record => record.meta.teacherOnly) && !isTeacherUser()) {
                console.log('非教师用户，重定向到首页');
                // 非教师用户跳转到首页
                next({ path: '/' });
            } else {
                // 允许访问
                console.log('认证通过，允许访问:', to.path);
                next();
            }
        }
    } else {
        // 不需要认证的路由直接放行
        console.log('路由不需要认证，直接放行:', to.path);
        next();
    }
})

export default router 