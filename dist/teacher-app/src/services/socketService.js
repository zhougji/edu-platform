import { io } from 'socket.io-client';
import Vue from 'vue';

// 使用全局配置或默认值
const SOCKET_URL = process.env.VUE_APP_SOCKET_URL || (window.location.protocol.replace('http', 'ws') + '//' + window.location.host + '/ws');

// Create a reactive object to hold socket state and data
const state = Vue.observable({
    isConnected: false,
    socketId: null,
    connectionError: null,
    // Add other relevant state properties as needed, e.g.:
    // activeConsultations: [],
    // pendingRequests: []
});

let socket = null;
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 5;

const connect = (token) => {
    if (socket && socket.connected) {
        console.log('Socket already connected.');
        return;
    }

    console.log(`Attempting to connect to WebSocket at ${SOCKET_URL}...`);

    // Disconnect previous socket if exists
    if (socket) {
        socket.disconnect();
    }

    // 重置连接状态
    state.connectionError = null;

    // 配置Socket.io选项
    const options = {
        auth: token ? { token } : undefined,
        transports: ['websocket', 'polling'], // 首选WebSocket，但也允许轮询作为备选
        reconnectionAttempts: MAX_RECONNECT_ATTEMPTS,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        timeout: 20000 // 连接超时时间20秒
    };

    console.log('Socket.io 连接配置:', options);

    try {
        socket = io(SOCKET_URL, options);

        socket.on('connect', () => {
            state.isConnected = true;
            state.socketId = socket.id;
            state.connectionError = null;
            reconnectAttempts = 0;
            console.log('WebSocket 连接成功:', socket.id);
            // Optionally join a default room or send initial info
            // Example: socket.emit('teacherOnline', { teacherId: /* get teacher ID */ });
        });

        socket.on('disconnect', (reason) => {
            state.isConnected = false;
            state.socketId = null;
            console.log('WebSocket 连接断开:', reason);
            // Handle disconnection, e.g., attempt reconnection
        });

        socket.on('connect_error', (error) => {
            state.isConnected = false;
            reconnectAttempts++;
            state.connectionError = error.message;
            console.error(`WebSocket 连接错误 (尝试 ${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS}):`, error);

            if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
                console.error('达到最大重连次数，放弃连接WebSocket');
                socket.disconnect();
            }
        });

        // --- Add Listeners for Custom Server Events --- 
        // Example: Listen for new student requests
        socket.on('newStudentRequest', (requestData) => {
            console.log('收到新的学生请求:', requestData);
            // Update state or notify components
            // Example: state.pendingRequests.push(requestData);
            // Example: Vue.prototype.$eventBus.$emit('new-request', requestData);
        });

        // Example: Listen for messages in a specific consultation
        socket.on('receiveMessage', (messageData) => {
            console.log('Received message:', messageData); // { roomId: '...', senderId: '...', text: '...' }
            // Find the relevant consultation and add the message
            // Example: updateConsultationMessages(messageData.roomId, messageData);
            // Example: Vue.prototype.$eventBus.$emit('new-message', messageData);
        });

        // Add more listeners as needed based on your backend events
        // e.g., socket.on('studentJoined', ...);
        // e.g., socket.on('studentLeft', ...);
    } catch (e) {
        console.error('创建WebSocket连接时发生错误:', e);
        state.connectionError = e.message;
    }
};

const disconnect = () => {
    if (socket) {
        socket.disconnect();
        state.isConnected = false;
        state.socketId = null;
    }
};

const emitEvent = (eventName, data) => {
    if (socket && state.isConnected) {
        socket.emit(eventName, data);
    } else {
        console.warn('Socket未连接。无法发送事件:', eventName);
    }
};

// --- Specific Event Emitter Functions (Examples) ---

const sendMessage = (roomId, text) => {
    emitEvent('sendMessage', { roomId, text });
};

const acceptRequest = (requestId, studentId) => {
    emitEvent('acceptRequest', { requestId, studentId });
};

const rejectRequest = (requestId) => {
    emitEvent('rejectRequest', { requestId });
};

export default {
    state, // Expose reactive state
    connect,
    disconnect,
    emitEvent, // Generic emitter
    // Expose specific actions
    sendMessage,
    acceptRequest,
    rejectRequest
}; 