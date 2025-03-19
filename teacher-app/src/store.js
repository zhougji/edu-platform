import { createStore } from 'vuex'
import axios from 'axios'

export default createStore({
    state: {
        teacher: null,
        consultationRequests: [],
        activeConsultations: [],
        resources: [],
        loading: false,
        error: null
    },
    mutations: {
        SET_TEACHER(state, teacher) {
            state.teacher = teacher
        },
        SET_CONSULTATION_REQUESTS(state, requests) {
            state.consultationRequests = requests
        },
        SET_ACTIVE_CONSULTATIONS(state, consultations) {
            state.activeConsultations = consultations
        },
        SET_RESOURCES(state, resources) {
            state.resources = resources
        },
        SET_LOADING(state, loading) {
            state.loading = loading
        },
        SET_ERROR(state, error) {
            state.error = error
        },
        CLEAR_ERROR(state) {
            state.error = null
        },
        ADD_ACTIVE_CONSULTATION(state, consultation) {
            state.activeConsultations.push(consultation)
        },
        REMOVE_CONSULTATION_REQUEST(state, requestId) {
            state.consultationRequests = state.consultationRequests.filter(r => r.id !== requestId)
        },
        UPDATE_ACTIVE_CONSULTATION(state, { consultationId, message }) {
            const consultationIndex = state.activeConsultations.findIndex(c => c.id === consultationId)
            if (consultationIndex !== -1) {
                if (!state.activeConsultations[consultationIndex].messages) {
                    state.activeConsultations[consultationIndex].messages = []
                }
                state.activeConsultations[consultationIndex].messages.push(message)
            }
        }
    },
    actions: {
        async login({ commit }, credentials) {
            try {
                commit('SET_LOADING', true)
                commit('CLEAR_ERROR')
                const response = await axios.post('http://localhost:5000/api/teachers/login', credentials)
                const { teacher, token } = response.data

                localStorage.setItem('teacherToken', token)
                localStorage.setItem('teacherId', teacher.id)

                commit('SET_TEACHER', teacher)
                return teacher
            } catch (error) {
                commit('SET_ERROR', error.response && error.response.data && error.response.data.message ? error.response.data.message : '登录失败')
                throw error
            } finally {
                commit('SET_LOADING', false)
            }
        },

        async fetchTeacherProfile({ commit }) {
            try {
                commit('SET_LOADING', true)
                const teacherId = localStorage.getItem('teacherId')
                const response = await axios.get(`http://localhost:5000/api/teachers/${teacherId}`, {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem('teacherToken')}`
                    }
                })
                commit('SET_TEACHER', response.data)
            } catch (error) {
                commit('SET_ERROR', error.response && error.response.data && error.response.data.message ? error.response.data.message : '获取教师信息失败')
            } finally {
                commit('SET_LOADING', false)
            }
        },

        async fetchConsultationRequests({ commit }) {
            try {
                commit('SET_LOADING', true)
                const teacherId = localStorage.getItem('teacherId')
                const response = await axios.get(`http://localhost:5000/api/consultations/requests?teacherId=${teacherId}`, {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem('teacherToken')}`
                    }
                })
                commit('SET_CONSULTATION_REQUESTS', response.data)
            } catch (error) {
                commit('SET_ERROR', error.response && error.response.data && error.response.data.message ? error.response.data.message : '获取咨询请求失败')
            } finally {
                commit('SET_LOADING', false)
            }
        },

        async acceptConsultation({ commit }, consultationId) {
            try {
                commit('SET_LOADING', true)
                const teacherId = localStorage.getItem('teacherId')
                const response = await axios.post(`http://localhost:5000/api/consultations/${consultationId}/accept`, {
                    teacherId
                }, {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem('teacherToken')}`
                    }
                })

                // 从请求列表中移除
                commit('REMOVE_CONSULTATION_REQUEST', consultationId)

                // 添加到活跃咨询列表
                commit('ADD_ACTIVE_CONSULTATION', response.data)

                return response.data
            } catch (error) {
                commit('SET_ERROR', error.response && error.response.data && error.response.data.message ? error.response.data.message : '接受咨询失败')
                throw error
            } finally {
                commit('SET_LOADING', false)
            }
        },

        async fetchActiveConsultations({ commit }) {
            try {
                commit('SET_LOADING', true)
                const teacherId = localStorage.getItem('teacherId')
                const response = await axios.get(`http://localhost:5000/api/consultations/active?teacherId=${teacherId}`, {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem('teacherToken')}`
                    }
                })
                commit('SET_ACTIVE_CONSULTATIONS', response.data)
            } catch (error) {
                commit('SET_ERROR', error.response && error.response.data && error.response.data.message ? error.response.data.message : '获取活跃咨询失败')
            } finally {
                commit('SET_LOADING', false)
            }
        },

        async sendConsultationMessage({ commit }, { consultationId, message }) {
            try {
                commit('SET_LOADING', true)
                await axios.post('http://localhost:5000/api/consultation-messages', {
                    consultationId,
                    content: message.content,
                    sender: 'teacher',
                    time: new Date().toLocaleString()
                }, {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem('teacherToken')}`
                    }
                })

                commit('UPDATE_ACTIVE_CONSULTATION', {
                    consultationId,
                    message: {
                        ...message,
                        sender: 'teacher',
                        time: new Date().toLocaleString()
                    }
                })
            } catch (error) {
                commit('SET_ERROR', error.response && error.response.data && error.response.data.message ? error.response.data.message : '发送消息失败')
                throw error
            } finally {
                commit('SET_LOADING', false)
            }
        },

        async fetchTeacherResources({ commit }) {
            try {
                commit('SET_LOADING', true)
                const teacherId = localStorage.getItem('teacherId')
                const response = await axios.get(`http://localhost:5000/api/resources/teacher/${teacherId}`, {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem('teacherToken')}`
                    }
                })
                commit('SET_RESOURCES', response.data)
            } catch (error) {
                commit('SET_ERROR', error.response && error.response.data && error.response.data.message ? error.response.data.message : '获取资源失败')
            } finally {
                commit('SET_LOADING', false)
            }
        },

        async uploadResource({ commit, dispatch }, resourceData) {
            try {
                commit('SET_LOADING', true)
                await axios.post('http://localhost:5000/api/resources', resourceData, {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem('teacherToken')}`,
                        'Content-Type': 'multipart/form-data'
                    }
                })

                // 刷新资源列表
                dispatch('fetchTeacherResources')
            } catch (error) {
                commit('SET_ERROR', error.response && error.response.data && error.response.data.message ? error.response.data.message : '上传资源失败')
                throw error
            } finally {
                commit('SET_LOADING', false)
            }
        },

        logout({ commit }) {
            localStorage.removeItem('teacherToken')
            localStorage.removeItem('teacherId')
            commit('SET_TEACHER', null)
        }
    },
    getters: {
        isAuthenticated: state => !!state.teacher,
        hasConsultationRequests: state => state.consultationRequests.length > 0,
        pendingConsultationCount: state => state.consultationRequests.length,
        activeConsultationCount: state => state.activeConsultations.length,
        teacherSubjects: state => state.teacher && state.teacher.subjects ? state.teacher.subjects : []
    }
}) 