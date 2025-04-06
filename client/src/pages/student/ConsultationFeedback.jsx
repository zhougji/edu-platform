import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { getConsultationById, submitConsultationFeedback } from '../../services/consultationService';

const ConsultationFeedback = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    const [consultation, setConsultation] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const [feedback, setFeedback] = useState({
        rating: 5,
        comment: ''
    });

    const [submitting, setSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState('');

    // 加载咨询详情
    useEffect(() => {
        const fetchConsultationDetail = async () => {
            try {
                setLoading(true);
                const consultationData = await getConsultationById(id);
                setConsultation(consultationData);

                // 如果咨询不是已完成状态或已有反馈，重定向回详情页
                if (consultationData.status !== 'completed' || consultationData.feedback) {
                    navigate(`/student/consultation/detail/${id}`);
                    return;
                }

                setLoading(false);
            } catch (error) {
                setError(error.message || '加载咨询详情失败');
                setLoading(false);
                console.error('加载咨询详情错误:', error);
            }
        };

        fetchConsultationDetail();
    }, [id, navigate]);

    // 处理评分变化
    const handleRatingChange = (newRating) => {
        setFeedback({
            ...feedback,
            rating: newRating
        });
    };

    // 处理评论变化
    const handleCommentChange = (e) => {
        setFeedback({
            ...feedback,
            comment: e.target.value
        });
    };

    // 提交反馈
    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            setSubmitting(true);
            setSubmitError('');

            await submitConsultationFeedback(id, feedback);

            // 提交成功后重定向回详情页
            navigate(`/student/consultation/detail/${id}`);
        } catch (error) {
            setSubmitError(error.message || '提交反馈失败');
            setSubmitting(false);
            console.error('提交反馈错误:', error);
        }
    };

    if (loading) {
        return (
            <div className="feedback-loading">
                <i className="fas fa-spinner fa-spin"></i>
                <span>加载中...</span>
            </div>
        );
    }

    if (error) {
        return (
            <div className="feedback-error">
                <i className="fas fa-exclamation-circle"></i>
                <span>{error}</span>
                <Link to="/student/consultations" className="back-button">
                    返回咨询列表
                </Link>
            </div>
        );
    }

    return (
        <div className="feedback-page">
            <div className="page-header">
                <div className="header-left">
                    <Link to={`/student/consultation/detail/${id}`} className="back-link">
                        <i className="fas fa-arrow-left"></i> 返回详情
                    </Link>
                    <h1>咨询评价</h1>
                </div>
            </div>

            <div className="feedback-content">
                <div className="consultation-summary">
                    <h2>咨询信息</h2>
                    <div className="summary-info">
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
                            <span className="info-label">学科:</span>
                            <span className="info-value">{consultation.subject}</span>
                        </div>
                    </div>
                </div>

                <div className="feedback-form-container">
                    <div className="feedback-header">
                        <h1>启明隅在线咨询 - 评价反馈</h1>
                        <p>您的反馈将帮助我们提供更好的服务</p>
                    </div>

                    <div className="feedback-form-header">
                        <h2>为{consultation.teacher.name}老师的咨询服务评分</h2>
                        <p>请根据此次咨询体验进行评价</p>
                    </div>

                    {submitError && (
                        <div className="submit-error">
                            <i className="fas fa-exclamation-circle"></i> {submitError}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="feedback-form">
                        <div className="form-group">
                            <label>教师表现评分</label>
                            <div className="rating-input">
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <i
                                        key={star}
                                        className={`fas fa-star ${star <= feedback.rating ? 'active' : ''}`}
                                        onClick={() => handleRatingChange(star)}
                                    ></i>
                                ))}
                                <span className="rating-value">{feedback.rating}/5</span>
                            </div>
                        </div>

                        <div className="form-group">
                            <label>评价内容 (可选)</label>
                            <textarea
                                value={feedback.comment}
                                onChange={handleCommentChange}
                                placeholder="请分享您对本次咨询的评价和建议..."
                                rows={5}
                            ></textarea>
                        </div>

                        <button
                            type="submit"
                            className="submit-button"
                            disabled={submitting}
                        >
                            {submitting ? (
                                <>
                                    <i className="fas fa-spinner fa-spin"></i> 提交中...
                                </>
                            ) : (
                                <>
                                    <i className="fas fa-paper-plane"></i> 提交评价
                                </>
                            )}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default ConsultationFeedback; 