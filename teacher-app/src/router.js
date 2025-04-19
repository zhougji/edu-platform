import Vue from 'vue'
import Router from 'vue-router'

// Import Views
// const Login = () => import('./views/Login.vue')
// const Register = () => import('./views/Register.vue')
const TeacherHome = () => import('./views/Home.vue')
const Resources = () => import('./views/Resources.vue')
const Consultations = () => import('./views/Consultations.vue')
const Profile = () => import('./views/Profile.vue')

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
        meta: { requiresAuth: false } // No longer requires auth
    },
    {
        path: '/', // Redirect root to home
        redirect: '/home'
    },
    {
        path: '/resources',
        name: 'Resources',
        component: Resources,
        meta: { requiresAuth: false } // No longer requires auth
    },
    {
        path: '/consultations',
        name: 'Consultations',
        component: Consultations,
        meta: { requiresAuth: false } // No longer requires auth
    },
    {
        path: '/profile',
        name: 'Profile',
        component: Profile,
        meta: { requiresAuth: false } // No longer requires auth
    },

    // Catch-all route
    { path: '*', redirect: '/home' }
]

const router = new Router({
    mode: 'history',
    base: process.env.BASE_URL || '/teacher-app/',
    routes
})

// Navigation Guard (Disabled)
router.beforeEach((to, from, next) => {
    // const token = localStorage.getItem('teacherToken')
    // const requiresAuth = to.matched.some(record => record.meta.requiresAuth)
    //
    // if (requiresAuth && !token) {
    //     next({ name: 'Login' })
    // } else if ((to.name === 'Login' || to.name === 'Register') && token) {
    //     next({ name: 'TeacherHome' })
    // } else {
    //     next()
    // }
    next(); // Always allow navigation
})

export default router 