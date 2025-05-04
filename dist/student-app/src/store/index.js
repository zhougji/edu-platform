import Vue from 'vue'
import Vuex from 'vuex'
import axios from 'axios' // Import axios to potentially fetch user data after login

Vue.use(Vuex)

export default new Vuex.Store({
    state: {
        // Authentication State
        isLoggedIn: !!localStorage.getItem('studentToken'), // Check token on initial load
        studentToken: localStorage.getItem('studentToken') || null,
        studentInfo: JSON.parse(localStorage.getItem('studentInfo')) || {},

        // Global Snackbar/Notification State
        snackbar: {
            show: false,
            text: '',
            color: 'info', // Corresponds to Element UI types: success, warning, info, error
            timeout: 3000 // Optional: if you want auto-hide
        }
    },
    mutations: {
        // --- Authentication Mutations ---
        SET_LOGIN_STATUS(state, loggedIn) {
            state.isLoggedIn = loggedIn;
        },
        SET_TOKEN(state, token) {
            state.studentToken = token;
            if (token) {
                localStorage.setItem('studentToken', token);
                axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
            } else {
                localStorage.removeItem('studentToken');
                delete axios.defaults.headers.common['Authorization'];
            }
        },
        SET_STUDENT_INFO(state, info) {
            state.studentInfo = info || {};
            if (info && Object.keys(info).length > 0) {
                localStorage.setItem('studentInfo', JSON.stringify(info));
            } else {
                localStorage.removeItem('studentInfo');
            }
        },

        // --- Snackbar Mutations ---
        SHOW_SNACKBAR(state, payload) {
            state.snackbar.text = payload.text;
            state.snackbar.color = payload.color || 'info';
            state.snackbar.timeout = payload.timeout || 3000;
            state.snackbar.show = true;
        },
        CLOSE_SNACKBAR(state) {
            state.snackbar.show = false;
            state.snackbar.text = '';
            state.snackbar.color = 'info';
        }
    },
    actions: {
        // --- Authentication Actions ---
        login({ commit }, { token, studentInfo }) {
            commit('SET_TOKEN', token);
            commit('SET_STUDENT_INFO', studentInfo);
            commit('SET_LOGIN_STATUS', true);
        },
        logout({ commit }) {
            commit('SET_TOKEN', null);
            commit('SET_STUDENT_INFO', null);
            commit('SET_LOGIN_STATUS', false);
            // Optionally redirect here or let the component handle it
            // router.push('/login').catch(()=>{});
        },
        checkAuth({ commit }) {
            // This action can re-verify token validity if needed, 
            // but for simplicity, we rely on the initial state check.
            // For a more robust check, you might make an API call here.
            const token = localStorage.getItem('studentToken');
            const info = localStorage.getItem('studentInfo');
            if (token && info) {
                commit('SET_LOGIN_STATUS', true);
                commit('SET_TOKEN', token); // Ensure Axios header is set on refresh
                try {
                    commit('SET_STUDENT_INFO', JSON.parse(info));
                } catch (e) {
                    console.error("Corrupted student info in storage");
                    commit('SET_STUDENT_INFO', null); // Clear corrupted info
                    commit('SET_LOGIN_STATUS', false);
                    commit('SET_TOKEN', null);
                }
            } else {
                commit('SET_LOGIN_STATUS', false);
            }
        },
        updateStudentInfo({ commit }, updatedInfo) {
            // Placeholder: You might fetch the full updated info from backend 
            // or just update the local state if backend returns updated info
            const currentInfo = JSON.parse(localStorage.getItem('studentInfo')) || {};
            const newInfo = { ...currentInfo, ...updatedInfo };
            commit('SET_STUDENT_INFO', newInfo);
        },

        // --- Snackbar Actions ---
        showSnackbar({ commit }, payload) {
            commit('SHOW_SNACKBAR', payload);
            // Optional: Auto-close after timeout
            // setTimeout(() => {
            //   commit('CLOSE_SNACKBAR');
            // }, payload.timeout || 3000);
        },
        closeSnackbar({ commit }) {
            commit('CLOSE_SNACKBAR');
        }
    },
    getters: {
        // Example getter
        isLoggedIn: state => state.isLoggedIn,
        studentInfo: state => state.studentInfo,
        studentName: state => state.studentInfo?.name, // Safely access name
        studentAvatar: state => state.studentInfo?.avatar
    }
}) 