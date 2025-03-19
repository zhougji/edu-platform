import { createRouter, createWebHistory } from 'vue-router'
import Dashboard from './components/Dashboard.vue'
import ResourceManagement from './components/ResourceManagement.vue'
import ConsultationRequests from './components/ConsultationRequests.vue'
import ActiveConsultations from './components/ActiveConsultations.vue'
import TeacherProfile from './components/TeacherProfile.vue'
import Login from './components/Login.vue'

const routes = [
    {
        path: '/',
        name: 'Dashboard',
        component: Dashboard,
        meta: { requiresAuth: true }
    },
    {
        path: '/resources',
        name: 'ResourceManagement',
        component: ResourceManagement,
        meta: { requiresAuth: true }
    },
    {
        path: '/consultation-requests',
        name: 'ConsultationRequests',
        component: ConsultationRequests,
        meta: { requiresAuth: true }
    },
    {
        path: '/active-consultations',
        name: 'ActiveConsultations',
        component: ActiveConsultations,
        meta: { requiresAuth: true }
    },
    {
        path: '/profile',
        name: 'TeacherProfile',
        component: TeacherProfile,
        meta: { requiresAuth: true }
    },
    {
        path: '/login',
        name: 'Login',
        component: Login
    }
]

const router = createRouter({
    history: createWebHistory(),
    routes
})

router.beforeEach((to, from, next) => {
    const isAuthenticated = localStorage.getItem('teacherToken')

    if (to.matched.some(record => record.meta.requiresAuth) && !isAuthenticated) {
        next('/login')
    } else {
        next()
    }
})

export default router
