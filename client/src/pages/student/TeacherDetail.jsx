import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { getTeacherById, createConsultation } from '../../services/consultationService';
import { getCurrentUser } from '../../services/authService';
import { sendConsultationRequest } from '../../services/socketService';

const TeacherDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const currentUser = getCurrentUser();

    const [teacher, setTeacher] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const [consultForm, setConsultForm] = useState({
        subject: '',
        question: '',
        scheduledTime: ''
    });

    const [formSubmitting, setFormSubmitting] = useState(false);
    const [formError, setFormError] = useState('');
    const [showForm, setShowForm] = useState(false);
    const [success, setSuccess] = useState('');

    // 加载教师信息
    useEffect(() => {
        const fetchTeacherDetail = async () => {
            try {
                setLoading(true);
                const teacherData = await getTeacherById(id);
                setTeacher(teacherData);

                // 预填教师的第一个学科
                if (teacherData.profile?.subjects?.length > 0) {
                    setConsultForm(prev => ({
                        ...prev,
                        subject: teacherData.profile.subjects[0]
                    }));
                }

                setLoading(false);
            } catch (error) {
                setError(error.message || '加载教师信息失败');
                setLoading(false);
                console.error('加载教师信息错误:', error);
            }
        };

        fetchTeacherDetail();
    }, [id]);

    // 处理表单变化
    const handleChange = (e) => {
        const { name, value } = e.target;
        setConsultForm({
            ...consultForm,
            [name]: value
        });
    };

    // 提交咨询请求
    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!currentUser) {
            navigate('/login', { state: { from: `/student/consultation/teacher/${id}` } });
            return;
        }

        // 表单验证
        if (!consultForm.subject || !consultForm.question) {
            setFormError('请填写所有必填字段');
            return;
        }

        try {
            setFormSubmitting(true);
            setFormError('');

            // 创建咨询请求
            const consultationData = {
                teacher: id,
                subject: consultForm.subject,
                question: consultForm.question,
                scheduledTime: consultForm.scheduledTime || undefined
            };

            const consultation = await createConsultation(consultationData);

            // 发送WebSocket通知
            sendConsultationRequest(consultation._id);

            // 重置表单
            setConsultForm({
                subject: teacher.profile?.subjects?.[0] || '',
                question: '',
                scheduledTime: ''
            });

            setSuccess('咨询请求已发送，请等待教师回复');
            setShowForm(false);
            setFormSubmitting(false);

            // 3秒后清除成功消息
            setTimeout(() => {
                setSuccess('');
            }, 3000);
        } catch (error) {
            setFormError(error.message || '发送咨询请求失败');
            setFormSubmitting(false);
            console.error('发送咨询请求错误:', error);
        }
    };

    if (loading) {
        return (
            <div className="teacher-detail-loading">
                <i className="fas fa-spinner fa-spin"></i>
                <span>正在加载教师信息...</span>
            </div>
        );
    }

    if (error) {
        return (
            <div className="teacher-detail-error">
                <i className="fas fa-exclamation-circle"></i>
                <span>{error}</span>
                <button onClick={() => navigate('/student/consultation')} className="back-button">
                    返回教师列表
                </button>
            </div>
        );
    }

    if (!teacher) {
        return (
            <div className="teacher-not-found">
                <i className="fas fa-user-slash"></i>
                <h3>未找到该教师</h3>
                <button onClick={() => navigate('/student/consultation')} className="back-button">
                    返回教师列表
                </button>
            </div>
        );
    }

    return (
        <div className="teacher-detail-page">
            <div className="back-link">
                <Link to="/student/consultation">
                    <i className="fas fa-arrow-left"></i> 返回教师列表
                </Link>
            </div>

            <div className="teacher-detail-card">
                <div className="teacher-header">
                    <div className="teacher-avatar-large">
                        <img src={teacher.avatar || '/images/default-avatar.jpg'} alt={teacher.name} />
                        {teacher.verification?.status === 'approved' && (
                            <div className="teacher-verified-badge-large">
                                <i className="fas fa-check-circle"></i> 已认证
                            </div>
                        )}
                    </div>

                    <div className="teacher-basic-info">
                        <h1 className="teacher-name">{teacher.name}</h1>

                        <div className="teacher-subjects">
                            {teacher.profile?.subjects && teacher.profile.subjects.map((subject, index) => (
                                <span key={index} className="subject-tag">
                                    {subject}
                                </span>
                            ))}
                        </div>

                        <div className="teacher-stats">
                            <div className="stat">
                                <i className="fas fa-star"></i>
                                <span>评分: {teacher.profile?.rating || '暂无'}</span>
                            </div>
                            <div className="stat">
                                <i className="fas fa-comments"></i>
                                <span>咨询: {teacher.profile?.consultationCount || 0}次</span>
                            </div>
                        </div>

                        <button
                            className="consult-button-large"
                            onClick={() => setShowForm(!showForm)}
                        >
                            <i className="fas fa-comments"></i>
                            {showForm ? '取消请教' : '请教'}
                        </button>
                    </div>
                </div>

                {success && (
                    <div className="success-message">
                        <i className="fas fa-check-circle"></i> {success}
                    </div>
                )}

                {showForm && (
                    <div className="consultation-form-container">
                        <h3>发送咨询请求</h3>

                        {formError && (
                            <div className="form-error">
                                <i className="fas fa-exclamation-circle"></i> {formError}
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="consultation-form">
                            <div className="form-group">
                                <label>学科</label>
                                <select
                                    name="subject"
                                    value={consultForm.subject}
                                    onChange={handleChange}
                                    required
                                >
                                    <option value="">请选择学科</option>
                                    {teacher.profile?.subjects && teacher.profile.subjects.map((subject, index) => (
                                        <option key={index} value={subject}>
                                            {subject}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="form-group">
                                <label>问题描述</label>
                                <textarea
                                    name="question"
                                    value={consultForm.question}
                                    onChange={handleChange}
                                    placeholder="请详细描述你的问题，以便教师更好地帮助你"
                                    rows={5}
                                    required
                                ></textarea>
                            </div>

                            <div className="form-group">
                                <label>预约时间 (可选)</label>
                                <input
                                    type="datetime-local"
                                    name="scheduledTime"
                                    value={consultForm.scheduledTime}
                                    onChange={handleChange}
                                    min={new Date().toISOString().slice(0, 16)}
                                />
                            </div>

                            <button
                                type="submit"
                                className="submit-button"
                                disabled={formSubmitting}
                            >
                                {formSubmitting ? (
                                    <>
                                        <i className="fas fa-spinner fa-spin"></i> 发送中...
                                    </>
                                ) : (
                                    <>
                                        <i className="fas fa-paper-plane"></i> 发送请求
                                    </>
                                )}
                            </button>
                        </form>
                    </div>
                )}

                <div className="teacher-content">
                    <div className="teacher-section">
                        <h2 className="section-title">个人介绍</h2>
                        <p className="teacher-bio">
                            {teacher.profile?.bio || '教师暂未填写个人介绍'}
                        </p>
                    </div>

                    <div className="teacher-section">
                        <h2 className="section-title">教学经历</h2>
                        {teacher.profile?.experience ? (
                            <div className="teacher-experience">
                                {teacher.profile.experience}
                            </div>
                        ) : (
                            <p className="no-data">教师暂未填写教学经历</p>
                        )}
                    </div>

                    <div className="teacher-section">
                        <h2 className="section-title">擅长内容</h2>
                        {teacher.profile?.specialties ? (
                            <div className="teacher-specialties">
                                {teacher.profile.specialties}
                            </div>
                        ) : (
                            <p className="no-data">教师暂未填写擅长内容</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TeacherDetail; 