import { io } from 'socket.io-client';
import Vue from 'vue';

// IMPORTANT: Replace with your actual WebSocket server URL
const SOCKET_URL = process.env.VUE_APP_SOCKET_URL || 'ws://localhost:3001';

// Create a reactive object to hold socket state and data
const state = Vue.observable({
    isConnected: false,
    socketId: null,
    // Add other relevant state properties as needed, e.g.:
    // activeConsultations: [],
    // pendingRequests: []
});

let socket = null;

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

    socket = io(SOCKET_URL, {
        // Send auth token for authentication if needed by the server
        auth: {
            token: token
        },
        transports: ['websocket'] // Use WebSocket transport primarily
    });

    socket.on('connect', () => {
        state.isConnected = true;
        state.socketId = socket.id;
        console.log('WebSocket Connected:', socket.id);
        // Optionally join a default room or send initial info
        // Example: socket.emit('teacherOnline', { teacherId: /* get teacher ID */ });
    });

    socket.on('disconnect', (reason) => {
        state.isConnected = false;
        state.socketId = null;
        console.log('WebSocket Disconnected:', reason);
        // Handle disconnection, e.g., attempt reconnection
    });

    socket.on('connect_error', (error) => {
        console.error('WebSocket Connection Error:', error);
        state.isConnected = false;
        // Handle connection errors
    });

    // --- Add Listeners for Custom Server Events --- 
    // Example: Listen for new student requests
    socket.on('newStudentRequest', (requestData) => {
        console.log('Received new student request:', requestData);
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
};

const disconnect = () => {
    if (socket) {
        socket.disconnect();
    }
};

const emitEvent = (eventName, data) => {
    if (socket && state.isConnected) {
        socket.emit(eventName, data);
    } else {
        console.warn('Socket not connected. Cannot emit event:', eventName);
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