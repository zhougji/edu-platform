import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { getConsultationById, cancelConsultation } from '../../services/consultationService';
import { getCurrentUser } from '../../services/authService';

const ConsultationDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const currentUser = getCurrentUser();

    const [consultation, setConsultation] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // 加载咨询详情
    useEffect(() => {
        const fetchConsultationDetail = async () => {
            try {
                setLoading(true);
                const consultationData = await getConsultationById(id);
                setConsultation(consultationData);
                setLoading(false);
            } catch (error) {
                setError(error.message || '加载咨询详情失败');
                setLoading(false);
                console.error('加载咨询详情错误:', error);
            }
        };

        fetchConsultationDetail();
    }, [id]);

    // 取消咨询请求
    const handleCancel = async () => {
        if (!window.confirm('确定要取消这个咨询请求吗？')) {
            return;
        }

        try {
            await cancelConsultation(id);

            // 更新状态
            setConsultation(prev => ({
                ...prev,
                status: 'canceled'
            }));
        } catch (error) {
            alert(`取消失败: ${error.message}`);
            console.error('取消咨询错误:', error);
        }
    };

    // 进入咨询室
    const enterConsultation = () => {
        navigate(`/student/consultation/room/${id}`);
    };

    // 获取状态文本
    const getStatusText = (status) => {
        switch (status) {
            case 'pending': return '等待教师接受';
            case 'accepted': return '教师已接受';
            case 'rejected': return '教师已婉拒';
            case 'completed': return '咨询已完成';
            case 'canceled': return '咨询已取消';
            default: return status;
        }
    };

    // 获取状态标志
    const getStatusBadge = (status) => {
        switch (status) {
            case 'pending':
                return <span className="status-badge pending">等待教师接受</span>;
            case 'accepted':
                return <span className="status-badge accepted">教师已接受</span>;
            case 'rejected':
                return <span className="status-badge rejected">教师已婉拒</span>;
            case 'completed':
                return <span className="status-badge completed">咨询已完成</span>;
            case 'canceled':
                return <span className="status-badge cancelled">咨询已取消</span>;
            default:
                return <span className="status-badge">{status}</span>;
        }
    };

    // 格式化日期
    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleString('zh-CN', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
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
            <div className="consultation-detail-loading">
                <i className="fas fa-spinner fa-spin"></i>
                <span>加载咨询详情中...</span>
            </div>
        );
    }

    if (error) {
        return (
            <div className="consultation-detail-error">
                <i className="fas fa-exclamation-circle"></i>
                <span>{error}</span>
                <Link to="/student/consultations" className="back-button">
                    返回咨询列表
                </Link>
            </div>
        );
    }

    if (!consultation) {
        return (
            <div className="consultation-not-found">
                <i className="fas fa-question-circle"></i>
                <h3>未找到咨询记录</h3>
                <Link to="/student/consultations" className="back-button">
                    返回咨询列表
                </Link>
            </div>
        );
    }

    return (
        <div className="consultation-detail-page">
            <div className="consultation-header">
                <h1>启明隅在线咨询 - 详情</h1>
            </div>

            <div className="consultation-detail-content">
                <div className="detail-section">
                    <h2>基本信息</h2>
                    <div className="detail-info">
                        <div className="info-item">
                            <span className="info-label">学科:</span>
                            <span className="info-value">{consultation.subject}</span>
                        </div>

                        <div className="info-item">
                            <span className="info-label">教师:</span>
                            <div className="teacher-info">
                                <img
                                    src={consultation.teacher.avatar || '/images/default-avatar.jpg'}
                                    alt={consultation.teacher.name}
                                    className="teacher-avatar"
                                />
                                <span className="teacher-name">{consultation.teacher.name}</span>
                            </div>
                        </div>

                        <div className="info-item">
                            <span className="info-label">创建时间:</span>
                            <span className="info-value">{formatDate(consultation.createdAt)}</span>
                        </div>

                        {consultation.scheduledTime && (
                            <div className="info-item">
                                <span className="info-label">预约时间:</span>
                                <span className="info-value">{formatDate(consultation.scheduledTime)}</span>
                            </div>
                        )}

                        <div className="info-item">
                            <span className="info-label">状态:</span>
                            <span className="info-value">{getStatusBadge(consultation.status)}</span>
                        </div>

                        {consultation.status === 'rejected' && (
                            <div className="info-item">
                                <span className="info-label">拒绝原因:</span>
                                <span className="info-value rejection-reason">
                                    {consultation.rejectionReason || '教师未提供拒绝原因'}
                                </span>
                            </div>
                        )}
                    </div>
                </div>

                <div className="detail-section">
                    <h2>问题描述</h2>
                    <div className="consultation-question-detail">
                        {consultation.question}
                    </div>
                </div>

                {consultation.messages && consultation.messages.length > 0 && (
                    <div className="detail-section">
                        <h2>消息记录</h2>
                        <div className="message-list">
                            {consultation.messages.map((message, index) => (
                                <div
                                    key={index}
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
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {consultation.feedback && (
                    <div className="detail-section">
                        <h2>咨询评价</h2>
                        <div className="feedback-detail">
                            <div className="rating">
                                {Array.from({ length: 5 }).map((_, index) => (
                                    <i
                                        key={index}
                                        className={`fas fa-star ${index < consultation.feedback.rating ? 'active' : ''}`}
                                    ></i>
                                ))}
                                <span className="rating-value">{consultation.feedback.rating}/5</span>
                            </div>

                            {consultation.feedback.comment && (
                                <div className="feedback-comment">
                                    {consultation.feedback.comment}
                                </div>
                            )}

                            <div className="feedback-date">
                                评价时间: {formatDate(consultation.feedback.createdAt)}
                            </div>
                        </div>
                    </div>
                )}

                <div className="consultation-actions">
                    {consultation.status === 'pending' && (
                        <button
                            className="cancel-btn"
                            onClick={handleCancel}
                        >
                            <i className="fas fa-times"></i> 取消请求
                        </button>
                    )}

                    {consultation.status === 'accepted' && (
                        <button
                            className="enter-btn"
                            onClick={enterConsultation}
                        >
                            <i className="fas fa-sign-in-alt"></i> 进入咨询
                        </button>
                    )}

                    {(consultation.status === 'completed' || consultation.status === 'rejected') && (
                        <Link
                            to={`/student/consultation/teacher/${consultation.teacher._id}`}
                            className="new-request-btn"
                        >
                            <i className="fas fa-redo"></i> 再次咨询
                        </Link>
                    )}

                    {consultation.status === 'completed' && !consultation.feedback && (
                        <Link
                            to={`/student/consultation/feedback/${consultation._id}`}
                            className="feedback-btn"
                        >
                            <i className="fas fa-star"></i> 评价咨询
                        </Link>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ConsultationDetail; 