import io from 'socket.io-client';
import { getCurrentUser } from './authService';

let socket = null;

// 初始化Socket连接
export const initSocket = () => {
    const user = getCurrentUser();
    const token = localStorage.getItem('token');

    if (!user || !token) {
        console.error('未登录，无法建立WebSocket连接');
        return null;
    }

    // 连接WebSocket，传递认证信息
    socket = io('/', {
        auth: { token },
        query: { token }
    });

    // 连接事件
    socket.on('connect', () => {
        console.log('WebSocket连接已建立');
    });

    // 错误处理
    socket.on('connect_error', (error) => {
        console.error('WebSocket连接错误:', error.message);
    });

    socket.on('error', (error) => {
        console.error('WebSocket错误:', error.message);
    });

    // 断开连接
    socket.on('disconnect', (reason) => {
        console.log('WebSocket连接已断开:', reason);
    });

    return socket;
};

// 获取Socket实例
export const getSocket = () => {
    if (!socket) {
        return initSocket();
    }
    return socket;
};

// 关闭Socket连接
export const closeSocket = () => {
    if (socket) {
        socket.disconnect();
        socket = null;
    }
};

// 监听咨询请求通知
export const onNewConsultation = (callback) => {
    const socket = getSocket();
    if (socket) {
        socket.on('consultation:new', callback);
    }
};

// 监听咨询状态变更
export const onConsultationStatus = (callback) => {
    const socket = getSocket();
    if (socket) {
        socket.on('consultation:status', callback);
    }
};

// 监听咨询准备就绪
export const onConsultationReady = (callback) => {
    const socket = getSocket();
    if (socket) {
        socket.on('consultation:ready', callback);
    }
};

// 监听新消息
export const onNewMessage = (callback) => {
    const socket = getSocket();
    if (socket) {
        socket.on('consultation:message', callback);
    }
};

// 监听消息已读状态
export const onMessagesRead = (callback) => {
    const socket = getSocket();
    if (socket) {
        socket.on('consultation:read', callback);
    }
};

// 监听咨询结束
export const onConsultationEnded = (callback) => {
    const socket = getSocket();
    if (socket) {
        socket.on('consultation:ended', callback);
    }
};

// 发送咨询请求通知
export const sendConsultationRequest = (consultationId) => {
    const socket = getSocket();
    if (socket) {
        socket.emit('consultation:request', { consultationId });
    }
};

// 更新咨询状态（教师使用）
export const updateStatus = (consultationId, status) => {
    const socket = getSocket();
    if (socket) {
        socket.emit('consultation:status', { consultationId, status });
    }
};

// 加入咨询房间
export const joinConsultation = (consultationId) => {
    const socket = getSocket();
    if (socket) {
        socket.emit('consultation:join', { consultationId });
    }
};

// 发送咨询消息
export const sendMessage = (consultationId, content) => {
    const socket = getSocket();
    if (socket) {
        socket.emit('consultation:message', { consultationId, content });
    }
};

// 标记消息已读
export const markMessagesAsRead = (consultationId, messageIds) => {
    const socket = getSocket();
    if (socket) {
        socket.emit('consultation:read', { consultationId, messageIds });
    }
};

// 结束咨询（教师使用）
export const endConsultation = (consultationId) => {
    const socket = getSocket();
    if (socket) {
        socket.emit('consultation:end', { consultationId });
    }
};

// 移除所有监听器
export const removeAllListeners = () => {
    const socket = getSocket();
    if (socket) {
        socket.removeAllListeners('consultation:new');
        socket.removeAllListeners('consultation:status');
        socket.removeAllListeners('consultation:ready');
        socket.removeAllListeners('consultation:message');
        socket.removeAllListeners('consultation:read');
        socket.removeAllListeners('consultation:ended');
    }
};
