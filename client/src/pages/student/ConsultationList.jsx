import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getConsultations, cancelConsultation } from '../../services/consultationService';
import { initSocket, onConsultationStatus, onConsultationReady } from '../../services/socketService';

const ConsultationList = () => {
    const navigate = useNavigate();

    const [consultations, setConsultations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [activeTab, setActiveTab] = useState('all');

    // 加载咨询列表
    const loadConsultations = async () => {
        try {
            setLoading(true);
            const result = await getConsultations();
            setConsultations(result.data);
            setLoading(false);
        } catch (error) {
            setError('加载咨询列表失败');
            setLoading(false);
            console.error('加载咨询列表错误:', error);
        }
    };

    // 初始化WebSocket和加载数据
    useEffect(() => {
        // 初始化Socket
        const socket = initSocket();

        // 监听咨询状态变更
        onConsultationStatus((data) => {
            // 更新咨询状态
            setConsultations(prev =>
                prev.map(c =>
                    c._id === data.consultation._id
                        ? { ...c, status: data.consultation.status }
                        : c
                )
            );
        });

        // 监听咨询准备就绪
        onConsultationReady((data) => {
            // 提示用户可以进入咨询室
            const notification = `教师已接受您的咨询请求，可以开始咨询了！`;
            alert(notification);

            // 更新咨询状态
            setConsultations(prev =>
                prev.map(c =>
                    c._id === data.consultation._id
                        ? { ...c, status: data.consultation.status }
                        : c
                )
            );
        });

        // 加载咨询列表
        loadConsultations();

        // 清理函数
        return () => {
            // 移除WebSocket监听器
            if (socket) {
                socket.off('consultation:status');
                socket.off('consultation:ready');
            }
        };
    }, []);

    // 取消咨询请求
    const handleCancel = async (consultationId) => {
        if (!window.confirm('确定要取消这个咨询请求吗？')) {
            return;
        }

        try {
            await cancelConsultation(consultationId);

            // 更新状态
            setConsultations(prev =>
                prev.map(c =>
                    c._id === consultationId
                        ? { ...c, status: 'canceled' }
                        : c
                )
            );
        } catch (error) {
            alert(`取消失败: ${error.message}`);
            console.error('取消咨询错误:', error);
        }
    };

    // 进入咨询室
    const enterConsultation = (consultationId) => {
        navigate(`/student/consultation/room/${consultationId}`);
    };

    // 获取状态文本
    const getStatusText = (status) => {
        switch (status) {
            case 'pending': return '待处理';
            case 'accepted': return '已接受';
            case 'rejected': return '已拒绝';
            case 'completed': return '已完成';
            case 'canceled': return '已取消';
            default: return status;
        }
    };

    // 获取状态标志
    const getStatusBadge = (status) => {
        let badgeClass = '';

        switch (status) {
            case 'pending':
                badgeClass = 'badge-warning';
                break;
            case 'accepted':
                badgeClass = 'badge-success';
                break;
            case 'rejected':
                badgeClass = 'badge-danger';
                break;
            case 'completed':
                badgeClass = 'badge-info';
                break;
            case 'canceled':
                badgeClass = 'badge-secondary';
                break;
            default:
                badgeClass = 'badge-primary';
        }

        return (
            <span className={`status-badge ${badgeClass}`}>
                {getStatusText(status)}
            </span>
        );
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

    // 根据选中的标签筛选咨询
    const filteredConsultations = activeTab === 'all'
        ? consultations
        : consultations.filter(c => c.status === activeTab);

    return (
        <div className="consultation-list-page">
            <div className="consultation-list-header">
                <h1>启明隅在线咨询</h1>
                <p>与专业教师一对一交流，解决您的学习难题</p>
            </div>

            <div className="page-header">
                <h1>我的咨询</h1>
                <Link to="/student/consultation" className="new-consultation-btn">
                    <i className="fas fa-plus"></i> 新咨询
                </Link>
            </div>

            <div className="status-tabs">
                <button
                    className={activeTab === 'all' ? 'active' : ''}
                    onClick={() => setActiveTab('all')}
                >
                    全部
                </button>
                <button
                    className={activeTab === 'pending' ? 'active' : ''}
                    onClick={() => setActiveTab('pending')}
                >
                    待处理
                </button>
                <button
                    className={activeTab === 'accepted' ? 'active' : ''}
                    onClick={() => setActiveTab('accepted')}
                >
                    已接受
                </button>
                <button
                    className={activeTab === 'completed' ? 'active' : ''}
                    onClick={() => setActiveTab('completed')}
                >
                    已完成
                </button>
                <button
                    className={activeTab === 'rejected' ? 'active' : ''}
                    onClick={() => setActiveTab('rejected')}
                >
                    已拒绝
                </button>
                <button
                    className={activeTab === 'canceled' ? 'active' : ''}
                    onClick={() => setActiveTab('canceled')}
                >
                    已取消
                </button>
            </div>

            <div className="consultation-list-container">
                {loading ? (
                    <div className="loading">
                        <i className="fas fa-spinner fa-spin"></i>
                        <span>加载咨询列表中...</span>
                    </div>
                ) : error ? (
                    <div className="error">
                        <i className="fas fa-exclamation-circle"></i>
                        <span>{error}</span>
                        <button onClick={loadConsultations} className="retry-button">
                            重试
                        </button>
                    </div>
                ) : consultations.length === 0 ? (
                    <div className="empty-consultations">
                        <img src="/images/empty-consultation.svg" alt="暂无咨询" />
                        <h3>您还没有发起过咨询</h3>
                        <p>启明隅在线咨询让您与专业教师一对一交流</p>
                        <Link to="/student/consultation/teachers" className="new-consultation-btn">
                            <i className="fas fa-plus-circle"></i> 寻找教师咨询
                        </Link>
                    </div>
                ) : (
                    <div className="consultation-list">
                        {filteredConsultations.map(consultation => (
                            <div key={consultation._id} className="consultation-item">
                                <div className="consultation-header">
                                    <h3 className="consultation-subject">
                                        {consultation.subject}
                                    </h3>
                                    {getStatusBadge(consultation.status)}
                                </div>

                                <div className="consultation-teacher">
                                    <div className="teacher-info">
                                        <img
                                            src={consultation.teacher.avatar || '/images/default-avatar.jpg'}
                                            alt={consultation.teacher.name}
                                            className="teacher-avatar"
                                        />
                                        <span className="teacher-name">{consultation.teacher.name}</span>
                                    </div>

                                    <div className="consultation-meta">
                                        <div className="meta-item">
                                            <i className="fas fa-calendar"></i>
                                            <span>创建时间: {formatDate(consultation.createdAt)}</span>
                                        </div>

                                        {consultation.scheduledTime && (
                                            <div className="meta-item">
                                                <i className="fas fa-clock"></i>
                                                <span>预约时间: {formatDate(consultation.scheduledTime)}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="consultation-question">
                                    <h4>问题描述:</h4>
                                    <p>{consultation.question}</p>
                                </div>

                                <div className="consultation-actions">
                                    {consultation.status === 'pending' && (
                                        <button
                                            className="cancel-btn"
                                            onClick={() => handleCancel(consultation._id)}
                                        >
                                            <i className="fas fa-times"></i> 取消请求
                                        </button>
                                    )}

                                    {consultation.status === 'accepted' && (
                                        <button
                                            className="enter-btn"
                                            onClick={() => enterConsultation(consultation._id)}
                                        >
                                            <i className="fas fa-sign-in-alt"></i> 进入咨询
                                        </button>
                                    )}

                                    {consultation.status === 'rejected' && (
                                        <div className="rejection-reason">
                                            <i className="fas fa-info-circle"></i>
                                            <span>拒绝原因: {consultation.rejectionReason || '教师未提供拒绝原因'}</span>
                                        </div>
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

                                    <Link
                                        to={`/student/consultation/detail/${consultation._id}`}
                                        className="view-detail-btn"
                                    >
                                        <i className="fas fa-eye"></i> 查看详情
                                    </Link>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default ConsultationList;
