import { createStore } from 'vuex'

export default createStore({
    state: {
        teacher: null,
        consultationRequests: [],
        activeConsultations: []
    },
    getters: {
        isAuthenticated: (state) => !!state.teacher,
        pendingConsultationCount: (state) => state.consultationRequests.length,
        activeConsultationCount: (state) => state.activeConsultations.length
    },
    mutations: {
        setTeacher(state, teacher) {
            state.teacher = teacher
        },
        updateTeacher(state, teacher) {
            state.teacher = { ...state.teacher, ...teacher }
        },
        setConsultationRequests(state, requests) {
            state.consultationRequests = requests
        },
        setActiveConsultations(state, consultations) {
            state.activeConsultations = consultations
        },
        addConsultationRequest(state, request) {
            state.consultationRequests.push(request)
        },
        removeConsultationRequest(state, requestId) {
            state.consultationRequests = state.consultationRequests.filter(
                request => request.id !== requestId
            )
        },
        addActiveConsultation(state, consultation) {
            state.activeConsultations.push(consultation)
        },
        removeActiveConsultation(state, consultationId) {
            state.activeConsultations = state.activeConsultations.filter(
                consultation => consultation.id !== consultationId
            )
        },
        clearTeacherData(state) {
            state.teacher = null
            state.consultationRequests = []
            state.activeConsultations = []
        }
    },
    actions: {
        async login({ commit }, credentials) {
            // 模拟登录请求
            return new Promise((resolve) => {
                setTimeout(() => {
                    const teacher = {
                        id: '1',
                        name: '张老师',
                        email: credentials.email,
                        avatar: '',
                        subjects: ['math', 'physics']
                    }
                    commit('setTeacher', teacher)
                    localStorage.setItem('teacherToken', 'mock-token')
                    localStorage.setItem('teacherId', teacher.id)
                    resolve()
                }, 1000)
            })
        },

        logout({ commit }) {
            localStorage.removeItem('teacherToken')
            localStorage.removeItem('teacherId')
            commit('clearTeacherData')
        },

        async fetchTeacherProfile({ commit }) {
            // 模拟获取教师信息
            return new Promise((resolve) => {
                setTimeout(() => {
                    const teacher = {
                        id: '1',
                        name: '张老师',
                        email: 'teacher@example.com',
                        phone: '13800138000',
                        school: '示例中学',
                        title: '高级教师',
                        subjects: ['math', 'physics'],
                        bio: '从事教育工作10年，擅长数学和物理教学。',
                        avatar: ''
                    }
                    commit('setTeacher', teacher)
                    resolve(teacher)
                }, 500)
            })
        },

        async fetchConsultationRequests({ commit }) {
            // 模拟获取咨询请求
            return new Promise((resolve) => {
                setTimeout(() => {
                    const requests = [
                        {
                            id: '1',
                            studentId: '101',
                            studentName: '张三',
                            subject: 'math',
                            topic: '高中数学函数问题',
                            message: '我在解函数问题时遇到了困难，希望能得到指导。',
                            status: 'pending',
                            createdAt: '2023-03-15 14:30'
                        },
                        {
                            id: '2',
                            studentId: '102',
                            studentName: '李四',
                            subject: 'physics',
                            topic: '物理力学问题',
                            message: '关于牛顿第二定律的应用，我有一些疑问。',
                            status: 'pending',
                            createdAt: '2023-03-15 15:45'
                        }
                    ]
                    commit('setConsultationRequests', requests)
                    resolve(requests)
                }, 500)
            })
        },

        async fetchActiveConsultations({ commit }) {
            // 模拟获取进行中的咨询
            return new Promise((resolve) => {
                setTimeout(() => {
                    const consultations = [
                        {
                            id: '3',
                            studentId: '103',
                            studentName: '王五',
                            subject: 'math',
                            topic: '概率统计问题',
                            status: 'active',
                            startedAt: '2023-03-16 09:20',
                            messages: [
                                {
                                    id: '1',
                                    senderId: '103',
                                    senderType: 'student',
                                    content: '老师您好，我在做概率题时遇到了问题。',
                                    timestamp: '2023-03-16 09:20'
                                },
                                {
                                    id: '2',
                                    senderId: '1',
                                    senderType: 'teacher',
                                    content: '你好，请详细描述一下你的问题。',
                                    timestamp: '2023-03-16 09:22'
                                }
                            ]
                        }
                    ]
                    commit('setActiveConsultations', consultations)
                    resolve(consultations)
                }, 500)
            })
        },

        async acceptConsultationRequest({ commit }, requestId) {
            // 模拟接受咨询请求
            return new Promise((resolve) => {
                setTimeout(() => {
                    commit('removeConsultationRequest', requestId)
                    // 添加到活跃咨询
                    const newConsultation = {
                        id: requestId,
                        studentId: '102',
                        studentName: '李四',
                        subject: 'physics',
                        topic: '物理力学问题',
                        status: 'active',
                        startedAt: new Date().toISOString(),
                        messages: []
                    }
                    commit('addActiveConsultation', newConsultation)
                    resolve(newConsultation)
                }, 500)
            })
        }
    }
}) 