import Vue from 'vue'
import Router from 'vue-router'

// Import Views (Lazy Loading recommended for better performance)
const Login = () => import('./views/Login.vue')
const Register = () => import('./views/Register.vue')
const StudentHome = () => import('./views/StudentHome.vue') // Corrected filename
const OnlineResources = () => import('./views/OnlineResources.vue') // Corrected filename
const OnlineConsultation = () => import('./views/OnlineConsultation.vue') // Corrected filename
const TeacherProfile = () => import('./views/TeacherProfile.vue') // View individual teacher profile
const AIAssistant = () => import('./views/AIAssistant.vue')
const Profile = () => import('./views/Profile.vue') // Student's own profile editing page

Vue.use(Router)

const routes = [
    // --- Authentication Routes --- 
    {
        path: '/login',
        name: 'Login',
        component: Login,
        meta: { requiresAuth: false }
    },
    {
        path: '/register',
        name: 'Register',
        component: Register,
        meta: { requiresAuth: false }
    },

    // --- Logged-in Student Routes --- 
    {
        path: '/home', // Or just '/' if it's the default after login
        name: 'StudentHome',
        component: StudentHome,
        meta: { requiresAuth: true }
    },
    {
        path: '/', // Redirect root to home if logged in
        redirect: '/home',
        meta: { requiresAuth: true }
    },
    {
        path: '/resources',
        name: 'OnlineResources',
        component: OnlineResources,
        meta: { requiresAuth: true }
    },
    {
        path: '/consultation',
        name: 'OnlineConsultation',
        component: OnlineConsultation,
        meta: { requiresAuth: true }
    },
    {
        // Route to view a specific teacher's profile before consultation
        path: '/consultation/teacher/:teacherId',
        name: 'TeacherProfile',
        component: TeacherProfile,
        props: true, // Pass route params as props
        meta: { requiresAuth: true }
    },
    {
        path: '/ai-assistant',
        name: 'AIAssistant',
        component: AIAssistant,
        meta: { requiresAuth: true }
    },
    {
        path: '/profile',
        name: 'Profile',
        component: Profile,
        meta: { requiresAuth: true }
    },

    // Add other routes like forgot password, etc.

    // Catch-all route (optional)
    { path: '*', redirect: '/home' }
]

const router = new Router({
    mode: 'history', // Use history mode for cleaner URLs
    base: process.env.BASE_URL || '/student-app/', // Adjust base if needed
    routes
})

// Navigation Guard (Checks if route requires authentication)
router.beforeEach((to, from, next) => {
    // const isAuthenticated = !!localStorage.getItem('token')
    // const requiresAuth = to.matched.some(record => record.meta.requiresAuth)
    //
    // if (requiresAuth && !isAuthenticated) {
    //     // Redirect to login page if trying to access protected route without token
    //     next('/login')
    // } else if (!requiresAuth && isAuthenticated) {
    //     // If user is logged in, redirect from login/register to home
    //     if (to.path === '/login' || to.path === '/register') {
    //         next('/home')
    //     } else {
    //         next()
    //     }
    // } else {
    //     // Otherwise, proceed as normal
    //     next()
    // }
    next(); // Directly proceed without checking auth
})

export default router 