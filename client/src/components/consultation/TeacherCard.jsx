import React from 'react';
import { Link } from 'react-router-dom';

const TeacherCard = ({ teacher }) => {
    // 格式化日期
    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('zh-CN', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    // 获取教师验证状态标签
    const getVerificationBadge = () => {
        if (teacher.verification && teacher.verification.status === 'approved') {
            return (
                <div className="teacher-verified-badge">
                    <i className="fas fa-check-circle"></i> 已认证
                </div>
            );
        }
        return null;
    };

    return (
        <div className="teacher-card">
            <Link to={`/student/consultation/teacher/${teacher._id}`} className="teacher-link">
                <div className="teacher-avatar">
                    <img src={teacher.avatar || '/images/default-avatar.jpg'} alt={teacher.name} />
                    {getVerificationBadge()}
                </div>

                <div className="teacher-info">
                    <h3 className="teacher-name">{teacher.name}</h3>

                    <div className="teacher-subjects">
                        {teacher.profile?.subjects && teacher.profile.subjects.map((subject, index) => (
                            <span key={index} className="subject-tag">
                                {subject}
                            </span>
                        ))}
                    </div>

                    <p className="teacher-intro">
                        {teacher.profile?.bio?.substring(0, 100)}
                        {teacher.profile?.bio?.length > 100 ? '...' : ''}
                    </p>

                    <div className="teacher-meta">
                        <span className="teacher-join-date">
                            <i className="fas fa-calendar-alt"></i> 加入于 {formatDate(teacher.createdAt)}
                        </span>
                    </div>
                </div>

                <div className="consult-button-container">
                    <button className="consult-button">
                        <i className="fas fa-comments"></i> 请教
                    </button>
                </div>
            </Link>
        </div>
    );
};

export default TeacherCard; 