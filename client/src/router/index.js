import { createRouter, createWebHistory } from 'vue-router'
import Home from '../views/Home.vue'
import AiAssistant from '../views/student/AiAssistant.vue'
import AiChatPage from '../views/student/AiChatPage.vue'
import ConsultationDetail from '../views/student/ConsultationDetail.vue'
import ConsultationFeedback from '../views/student/ConsultationFeedback.vue'
import ConsultationRoom from '../views/student/ConsultationRoom.vue'
import ConsultationList from '../views/student/ConsultationList.vue'
import { getCurrentUser } from '../services/authService'

// 保护路由的导航守卫
const requireAuth = (to, from, next) => {
    const currentUser = getCurrentUser()
    if (!currentUser) {
        next('/login')
    } else if (to.meta.role && currentUser.role !== to.meta.role) {
        next('/')
    } else {
        next()
    }
}

const routes = [
    {
        path: '/',
        name: 'Home',
        component: Home
    },
    {
        path: '/student/ai',
        name: 'AiAssistant',
        component: AiAssistant,
        beforeEnter: requireAuth,
        meta: { role: 'student' }
    },
    {
        path: '/student/ai/new',
        name: 'NewAiChat',
        component: AiChatPage,
        beforeEnter: requireAuth,
        meta: { role: 'student' }
    },
    {
        path: '/student/ai/chat/:id',
        name: 'AiChat',
        component: AiChatPage,
        beforeEnter: requireAuth,
        meta: { role: 'student' }
    },
    {
        path: '/student/consultations',
        name: 'Consultations',
        component: ConsultationList,
        beforeEnter: requireAuth,
        meta: { role: 'student' }
    },
    {
        path: '/student/consultation/detail/:id',
        name: 'ConsultationDetail',
        component: ConsultationDetail,
        beforeEnter: requireAuth,
        meta: { role: 'student' }
    },
    {
        path: '/student/consultation/feedback/:id',
        name: 'ConsultationFeedback',
        component: ConsultationFeedback,
        beforeEnter: requireAuth,
        meta: { role: 'student' }
    },
    {
        path: '/student/consultation/room/:id',
        name: 'ConsultationRoom',
        component: ConsultationRoom,
        beforeEnter: requireAuth,
        meta: { role: 'student' }
    }
]

const router = createRouter({
    history: createWebHistory(),
    routes
})

export default router 