import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { zhCN } from 'date-fns/locale';

const AIChatHistory = ({ chats, onDeleteChat }) => {
    const location = useLocation();
    const currentPath = location.pathname;

    // 格式化日期：显示为"x分钟前"、"x小时前"等
    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return formatDistanceToNow(date, { addSuffix: true, locale: zhCN });
    };

    // 获取主题图标
    const getSubjectIcon = (subject) => {
        switch (subject) {
            case '数学': return 'fas fa-calculator';
            case '语文': return 'fas fa-book';
            case '英语': return 'fas fa-language';
            case '物理': return 'fas fa-atom';
            case '化学': return 'fas fa-flask';
            case '生物': return 'fas fa-dna';
            case '历史': return 'fas fa-history';
            case '地理': return 'fas fa-globe-asia';
            case '政治': return 'fas fa-balance-scale';
            default: return 'fas fa-brain';
        }
    };

    if (!chats || chats.length === 0) {
        return (
            <div className="no-chats">
                <i className="fas fa-comment-slash"></i>
                <p>暂无历史会话</p>
                <Link to="/student/ai/new" className="new-chat-btn">
                    <i className="fas fa-plus"></i> 开始新会话
                </Link>
            </div>
        );
    }

    return (
        <div className="ai-chat-history">
            <div className="history-header">
                <h3>历史会话</h3>
                <Link to="/student/ai/new" className="new-chat-btn">
                    <i className="fas fa-plus"></i> 新会话
                </Link>
            </div>

            <div className="chat-list">
                {chats.map((chat) => (
                    <div
                        key={chat._id}
                        className={`chat-item ${currentPath.includes(chat._id) ? 'active' : ''}`}
                    >
                        <Link to={`/student/ai/chat/${chat._id}`} className="chat-link">
                            <div className="chat-icon">
                                <i className={getSubjectIcon(chat.subject)}></i>
                            </div>
                            <div className="chat-info">
                                <div className="chat-title">{chat.title}</div>
                                <div className="chat-meta">
                                    <span className="chat-subject">{chat.subject}</span>
                                    <span className="chat-time">{formatDate(chat.updatedAt)}</span>
                                </div>
                            </div>
                        </Link>
                        <button
                            className="delete-chat-btn"
                            onClick={() => onDeleteChat(chat._id)}
                            title="删除会话"
                        >
                            <i className="fas fa-trash-alt"></i>
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default AIChatHistory; 