import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { getConsultationById } from '../../services/consultationService';
import {
    initSocket,
    joinConsultation,
    sendMessage,
    onNewMessage,
    markMessagesAsRead,
    onMessagesRead,
    onConsultationEnded
} from '../../services/socketService';
import { getCurrentUser } from '../../services/authService';

const ConsultationRoom = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const currentUser = getCurrentUser();
    const messageListRef = useRef(null);
    const messageInputRef = useRef(null);

    const [consultation, setConsultation] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [sending, setSending] = useState(false);

    // 加载咨询详情和消息记录
    useEffect(() => {
        const fetchConsultation = async () => {
            try {
                setLoading(true);
                const data = await getConsultationById(id);

                // 验证咨询状态
                if (data.status !== 'accepted') {
                    navigate(`/student/consultation/detail/${id}`);
                    return;
                }

                // 验证当前用户是否是咨询的学生
                if (data.student._id !== currentUser.id) {
                    navigate('/student/consultations');
                    return;
                }

                setConsultation(data);
                setMessages(data.messages || []);
                setLoading(false);

                // 初始化WebSocket连接
                const socket = initSocket();

                // 加入咨询房间
                joinConsultation(id);

                // 标记消息为已读
                if (data.messages && data.messages.length > 0) {
                    const unreadIds = data.messages
                        .filter(msg => !msg.read && msg.sender._id !== currentUser.id)
                        .map(msg => msg._id);

                    if (unreadIds.length > 0) {
                        markMessagesAsRead(id, unreadIds);
                    }
                }
            } catch (error) {
                setError(error.message || '加载咨询详情失败');
                setLoading(false);
                console.error('加载咨询详情错误:', error);
            }
        };

        fetchConsultation();
    }, [id, currentUser.id, navigate]);

    // 监听WebSocket事件
    useEffect(() => {
        // 新消息事件
        onNewMessage((data) => {
            if (data.consultationId === id) {
                // 添加新消息到列表
                setMessages(prev => [...prev, data.message]);

                // 如果不是自己发送的消息，则标记为已读
                if (data.message.sender._id !== currentUser.id) {
                    markMessagesAsRead(id, [data.message._id]);
                }
            }
        });

        // 消息已读事件
        onMessagesRead((data) => {
            if (data.consultationId === id) {
                // 更新消息的已读状态
                setMessages(prev =>
                    prev.map(msg =>
                        data.messageIds.includes(msg._id)
                            ? { ...msg, read: true }
                            : msg
                    )
                );
            }
        });

        // 咨询结束事件
        onConsultationEnded((data) => {
            if (data.consultation._id === id) {
                alert('教师已结束本次咨询。');
                navigate(`/student/consultation/detail/${id}`);
            }
        });

        // 消息滚动到底部
        if (messageListRef.current) {
            messageListRef.current.scrollTop = messageListRef.current.scrollHeight;
        }

        // 清理函数
        return () => {
            const socket = initSocket();
            if (socket) {
                socket.off('consultation:message');
                socket.off('consultation:read');
                socket.off('consultation:ended');
            }
        };
    }, [id, currentUser.id, navigate, messages]);

    // 发送消息
    const handleSendMessage = async (e) => {
        e.preventDefault();

        if (!newMessage.trim()) return;

        try {
            setSending(true);

            // 通过WebSocket发送消息
            sendMessage(id, newMessage.trim());

            // 清空输入框
            setNewMessage('');
            setSending(false);

            // 聚焦输入框
            if (messageInputRef.current) {
                messageInputRef.current.focus();
            }
        } catch (error) {
            console.error('发送消息错误:', error);
            setSending(false);
        }
    };

    // 格式化消息时间
    const formatMessageTime = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleString('zh-CN', {
            month: 'numeric',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    if (loading) {
        return (
            <div className="consultation-room-loading">
                <i className="fas fa-spinner fa-spin"></i>
                <span>正在进入咨询室...</span>
            </div>
        );
    }

    if (error) {
        return (
            <div className="consultation-room-error">
                <i className="fas fa-exclamation-circle"></i>
                <span>{error}</span>
                <Link to="/student/consultations" className="back-button">
                    返回咨询列表
                </Link>
            </div>
        );
    }

    return (
        <div className="consultation-room">
            <div className="room-header">
                <div className="header-left">
                    <Link to={`/student/consultation/detail/${id}`} className="back-link">
                        <i className="fas fa-arrow-left"></i> 返回咨询详情
                    </Link>
                    <h1>启明隅在线咨询室</h1>
                </div>
                <div className="header-right">
                    <div className="teacher-info">
                        <img
                            src={consultation.teacher.avatar || '/images/default-avatar.jpg'}
                            alt={consultation.teacher.name}
                            className="teacher-avatar"
                        />
                        <div className="teacher-name">{consultation.teacher.name} 老师</div>
                    </div>
                </div>
            </div>

            <div className="consultation-question">
                <h3>咨询问题:</h3>
                <p>{consultation.question}</p>
            </div>

            <div className="consultation-conversation">
                <div className="message-list" ref={messageListRef}>
                    {messages.length === 0 ? (
                        <div className="no-messages">
                            <i className="fas fa-comments"></i>
                            <p>还没有消息，开始发送消息向教师咨询吧</p>
                        </div>
                    ) : (
                        messages.map((message, index) => (
                            <div
                                key={message._id || index}
                                className={`message-item ${message.sender._id === currentUser.id ? 'sent' : 'received'}`}
                            >
                                <div className="message-avatar">
                                    <img
                                        src={message.sender.avatar || '/images/default-avatar.jpg'}
                                        alt={message.sender.name}
                                    />
                                </div>
                                <div className="message-content">
                                    <div className="message-header">
                                        <span className="message-sender">{message.sender.name}</span>
                                        <span className="message-time">{formatMessageTime(message.timestamp)}</span>
                                    </div>
                                    <div className="message-text">{message.content}</div>
                                    {message.sender._id === currentUser.id && (
                                        <div className="message-status">
                                            {message.read ? (
                                                <span className="read-status">已读</span>
                                            ) : (
                                                <span className="unread-status">未读</span>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </div>

                <form className="message-input-form" onSubmit={handleSendMessage}>
                    <textarea
                        ref={messageInputRef}
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="输入您的问题或想法..."
                        className="message-input"
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                handleSendMessage(e);
                            }
                        }}
                    ></textarea>
                    <button
                        type="submit"
                        className="send-button"
                        disabled={sending || !newMessage.trim()}
                    >
                        {sending ? (
                            <i className="fas fa-spinner fa-spin"></i>
                        ) : (
                            <i className="fas fa-paper-plane"></i>
                        )}
                        发送
                    </button>
                </form>

                <div className="input-tips">
                    按Enter键发送，Shift+Enter换行
                </div>
            </div>
        </div>
    );
};

export default ConsultationRoom;
