import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import { sendMessage } from '../../services/aiService';

const AIChat = ({ chat, onChatUpdate }) => {
    const navigate = useNavigate();
    const [message, setMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const messagesEndRef = useRef(null);
    const inputRef = useRef(null);

    // 聊天窗口滚动到底部
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    // 每次消息更新时滚动到底部
    useEffect(() => {
        scrollToBottom();
    }, [chat?.messages]);

    // 页面加载时聚焦输入框
    useEffect(() => {
        if (inputRef.current) {
            inputRef.current.focus();
        }
    }, []);

    // 处理消息发送
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!message.trim() || isLoading) return;

        const messageText = message.trim();
        setIsLoading(true);
        setError('');
        setMessage('');

        try {
            const result = await sendMessage(messageText, chat?._id);

            // 如果是新会话，重定向到新会话页面
            if (!chat && result.chat) {
                navigate(`/student/ai/chat/${result.chat._id}`);
            }

            // 更新会话状态
            if (onChatUpdate && result.chat) {
                onChatUpdate(result.chat);
            }
        } catch (error) {
            console.error('发送消息错误:', error);
            setError(error.message || '发送消息失败');
        } finally {
            setIsLoading(false);
        }
    };

    // 格式化消息时间
    const formatTime = (timestamp) => {
        const date = new Date(timestamp);
        return date.toLocaleTimeString('zh-CN', {
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <div className="ai-chat-container">
            <div className="chat-messages">
                {/* 欢迎消息 */}
                {(!chat || chat.messages.length === 0) && (
                    <div className="welcome-message">
                        <div className="ai-avatar">
                            <i className="fas fa-robot"></i>
                        </div>
                        <div className="message-content">
                            <div className="message-header">
                                <span className="message-sender">启明助手</span>
                            </div>
                            <div className="message-text">
                                <p>您好！我是启明助手，很高兴为您服务。</p>
                                <p>您可以向我提问任何学习相关的问题，例如：</p>
                                <ul>
                                    <li>解释函数的概念</li>
                                    <li>帮我分析《荷塘月色》</li>
                                    <li>简化7x + 3 = 5x - 9</li>
                                    <li>为什么会有四季变化？</li>
                                </ul>
                                <p>我会尽力帮助您解答问题，提供学习指导！</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* 聊天消息 */}
                {chat && chat.messages.map((msg, index) => (
                    <div
                        key={index}
                        className={`message ${msg.role === 'user' ? 'user-message' : 'ai-message'}`}
                    >
                        <div className={msg.role === 'user' ? 'user-avatar' : 'ai-avatar'}>
                            {msg.role === 'user' ? (
                                <i className="fas fa-user"></i>
                            ) : (
                                <i className="fas fa-robot"></i>
                            )}
                        </div>
                        <div className="message-content">
                            <div className="message-header">
                                <span className="message-sender">
                                    {msg.role === 'user' ? '我' : '启明助手'}
                                </span>
                                <span className="message-time">
                                    {formatTime(msg.timestamp)}
                                </span>
                            </div>
                            <div className="message-text">
                                {msg.role === 'user' ? (
                                    <p>{msg.content}</p>
                                ) : (
                                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                                )}
                            </div>
                        </div>
                    </div>
                ))}

                {/* 加载状态 */}
                {isLoading && (
                    <div className="message ai-message">
                        <div className="ai-avatar">
                            <i className="fas fa-robot"></i>
                        </div>
                        <div className="message-content">
                            <div className="message-header">
                                <span className="message-sender">启明助手</span>
                            </div>
                            <div className="message-text">
                                <div className="typing-indicator">
                                    <span></span>
                                    <span></span>
                                    <span></span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* 错误消息 */}
                {error && (
                    <div className="error-message">
                        <i className="fas fa-exclamation-circle"></i>
                        <span>{error}</span>
                    </div>
                )}

                <div ref={messagesEndRef} />
            </div>

            <form className="chat-input-form" onSubmit={handleSubmit}>
                <textarea
                    ref={inputRef}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="向启明助手提问..."
                    className="chat-input"
                    disabled={isLoading}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleSubmit(e);
                        }
                    }}
                ></textarea>
                <button
                    type="submit"
                    className="send-button"
                    disabled={isLoading || !message.trim()}
                >
                    {isLoading ? (
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
    );
};

export default AIChat; 