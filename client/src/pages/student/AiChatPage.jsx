import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import AIChat from '../../components/ai/AIChat';
import AIChatHistory from '../../components/ai/AIChatHistory';
import { getAiChatById, getAiChats, deleteAiChat, updateAiChat } from '../../services/aiService';

const AiChatPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const isNewChat = id === 'new';

    const [chat, setChat] = useState(null);
    const [chatHistory, setChatHistory] = useState([]);
    const [loading, setLoading] = useState(!isNewChat);
    const [error, setError] = useState('');
    const [historyLoading, setHistoryLoading] = useState(true);
    const [isEditingTitle, setIsEditingTitle] = useState(false);
    const [newTitle, setNewTitle] = useState('');

    // 加载当前会话数据
    useEffect(() => {
        if (isNewChat) {
            setLoading(false);
            return;
        }

        const fetchChat = async () => {
            try {
                setLoading(true);
                const chatData = await getAiChatById(id);
                setChat(chatData);
                setNewTitle(chatData.title);
                setLoading(false);
            } catch (error) {
                setError(error.message || '加载会话失败');
                setLoading(false);
                console.error('加载会话错误:', error);
            }
        };

        fetchChat();
    }, [id, isNewChat]);

    // 加载会话历史
    useEffect(() => {
        const fetchChatHistory = async () => {
            try {
                setHistoryLoading(true);
                const result = await getAiChats(1, 30); // 加载30条历史会话
                setChatHistory(result.data);
                setHistoryLoading(false);
            } catch (error) {
                console.error('加载会话历史错误:', error);
                setHistoryLoading(false);
            }
        };

        fetchChatHistory();
    }, []);

    // 处理会话更新
    const handleChatUpdate = (updatedChat) => {
        setChat(updatedChat);

        // 更新历史列表中的对应会话
        setChatHistory(prev => {
            const exists = prev.some(c => c._id === updatedChat._id);
            if (exists) {
                return prev.map(c =>
                    c._id === updatedChat._id
                        ? { ...c, title: updatedChat.title, updatedAt: updatedChat.updatedAt }
                        : c
                );
            } else {
                return [
                    {
                        _id: updatedChat._id,
                        title: updatedChat.title,
                        subject: updatedChat.subject,
                        updatedAt: updatedChat.updatedAt
                    },
                    ...prev
                ];
            }
        });
    };

    // 开始编辑标题
    const startEditingTitle = () => {
        setIsEditingTitle(true);
    };

    // 保存标题
    const saveTitle = async () => {
        if (!newTitle.trim()) {
            setNewTitle(chat.title);
            setIsEditingTitle(false);
            return;
        }

        try {
            const updatedChat = await updateAiChat(chat._id, { title: newTitle.trim() });
            setChat(updatedChat);

            // 更新历史列表中的标题
            setChatHistory(prev =>
                prev.map(c =>
                    c._id === chat._id
                        ? { ...c, title: updatedChat.title }
                        : c
                )
            );

            setIsEditingTitle(false);
        } catch (error) {
            console.error('更新标题错误:', error);
        }
    };

    // 取消编辑标题
    const cancelEditTitle = () => {
        setNewTitle(chat.title);
        setIsEditingTitle(false);
    };

    // 处理标题输入变化
    const handleTitleChange = (e) => {
        setNewTitle(e.target.value);
    };

    // 处理删除会话
    const handleDeleteChat = async (chatId) => {
        if (!window.confirm('确定要删除这个会话吗？')) {
            return;
        }

        try {
            await deleteAiChat(chatId);

            // 从历史列表中移除
            setChatHistory(prev => prev.filter(c => c._id !== chatId));

            // 如果删除的是当前会话，导航到新会话页面
            if (chat && chat._id === chatId) {
                navigate('/student/ai/new');
            }
        } catch (error) {
            console.error('删除会话错误:', error);
            alert('删除会话失败: ' + (error.message || '未知错误'));
        }
    };

    // 处理键盘事件
    const handleTitleKeyDown = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            saveTitle();
        } else if (e.key === 'Escape') {
            cancelEditTitle();
        }
    };

    return (
        <div className="ai-chat-page">
            <div className="chat-sidebar">
                <AIChatHistory
                    chats={chatHistory}
                    loading={historyLoading}
                    onDeleteChat={handleDeleteChat}
                />
            </div>

            <div className="chat-main">
                {loading ? (
                    <div className="chat-loading">
                        <i className="fas fa-spinner fa-spin"></i>
                        <span>加载会话中...</span>
                    </div>
                ) : error ? (
                    <div className="chat-error">
                        <i className="fas fa-exclamation-circle"></i>
                        <span>{error}</span>
                    </div>
                ) : (
                    <>
                        {!isNewChat && (
                            <div className="chat-header">
                                {isEditingTitle ? (
                                    <div className="title-edit-container">
                                        <input
                                            type="text"
                                            value={newTitle}
                                            onChange={handleTitleChange}
                                            onBlur={saveTitle}
                                            onKeyDown={handleTitleKeyDown}
                                            className="title-input"
                                            autoFocus
                                            maxLength={50}
                                        />
                                        <div className="title-edit-actions">
                                            <button
                                                className="save-btn"
                                                onClick={saveTitle}
                                                title="保存"
                                            >
                                                <i className="fas fa-check"></i>
                                            </button>
                                            <button
                                                className="cancel-btn"
                                                onClick={cancelEditTitle}
                                                title="取消"
                                            >
                                                <i className="fas fa-times"></i>
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="chat-title" onClick={startEditingTitle}>
                                        <h2>{chat?.title || '新会话'}</h2>
                                        <button className="edit-title-btn" title="编辑标题">
                                            <i className="fas fa-edit"></i>
                                        </button>
                                    </div>
                                )}

                                <div className="chat-meta">
                                    <span className="chat-subject">
                                        <i className="fas fa-tag"></i> {chat?.subject || '通用'}
                                    </span>
                                </div>
                            </div>
                        )}

                        <div className="chat-content">
                            <AIChat
                                chat={chat}
                                onChatUpdate={handleChatUpdate}
                            />
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default AiChatPage;
