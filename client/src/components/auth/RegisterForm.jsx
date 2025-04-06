import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { register } from '../../services/authService';

const RegisterForm = ({ userType }) => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        name: '',
        contactType: 'phone',
        contact: '',
        verificationCode: '',
        password: '',
        confirmPassword: '',
    });
    const [isCodeSent, setIsCodeSent] = useState(false);
    const [countdown, setCountdown] = useState(0);
    const [error, setError] = useState('');

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleContactTypeChange = (type) => {
        setFormData({
            ...formData,
            contactType: type,
            contact: '' // 切换联系方式类型时清空联系方式
        });
    };

    const handleSendVerificationCode = async () => {
        try {
            const { contactType, contact } = formData;

            if (!contact) {
                setError(contactType === 'phone' ? '请输入手机号' : '请输入邮箱');
                return;
            }

            // 调用发送验证码API
            const response = await fetch('/api/auth/sendVerificationCode', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ contactType, contact })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || '发送验证码失败');
            }

            setIsCodeSent(true);
            setCountdown(60);

            // 倒计时
            const timer = setInterval(() => {
                setCountdown((prev) => {
                    if (prev <= 1) {
                        clearInterval(timer);
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        } catch (error) {
            setError(error.message);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            setError('');
            const { name, contactType, contact, verificationCode, password, confirmPassword } = formData;

            // 验证密码
            if (password !== confirmPassword) {
                setError('两次输入的密码不一致');
                return;
            }

            // 注册用户
            const result = await register(
                name,
                contactType,
                contact,
                verificationCode,
                password,
                userType === 'student' ? 'student' : 'teacher'
            );

            // 根据用户角色跳转到对应页面
            if (result.user.role === 'student') {
                navigate('/student/dashboard');
            } else if (result.user.role === 'teacher') {
                navigate('/teacher/dashboard');
            }
        } catch (error) {
            setError(error.message);
        }
    };

    return (
        <div className="register-form">
            <h2>{userType === 'student' ? '学生注册' : '教师注册'}</h2>

            {error && <div className="error-message">{error}</div>}

            <form onSubmit={handleSubmit}>
                <div className="form-group">
                    <label>姓名</label>
                    <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        placeholder="请输入真实姓名"
                        required
                    />
                </div>

                <div className="form-group">
                    <label>注册方式</label>
                    <div className="contact-type-selector">
                        <button
                            type="button"
                            className={formData.contactType === 'phone' ? 'active' : ''}
                            onClick={() => handleContactTypeChange('phone')}
                        >
                            手机号
                        </button>
                        <button
                            type="button"
                            className={formData.contactType === 'email' ? 'active' : ''}
                            onClick={() => handleContactTypeChange('email')}
                        >
                            邮箱
                        </button>
                    </div>
                </div>

                <div className="form-group">
                    <label>{formData.contactType === 'phone' ? '手机号' : '邮箱'}</label>
                    <input
                        type={formData.contactType === 'phone' ? 'tel' : 'email'}
                        name="contact"
                        value={formData.contact}
                        onChange={handleChange}
                        placeholder={formData.contactType === 'phone' ? '请输入手机号' : '请输入邮箱'}
                        required
                    />
                </div>

                <div className="form-group verification-code">
                    <label>验证码</label>
                    <div className="code-input-container">
                        <input
                            type="text"
                            name="verificationCode"
                            value={formData.verificationCode}
                            onChange={handleChange}
                            placeholder="请输入验证码"
                            required
                        />
                        <button
                            type="button"
                            onClick={handleSendVerificationCode}
                            disabled={countdown > 0}
                        >
                            {countdown > 0 ? `重新发送(${countdown}s)` : '获取验证码'}
                        </button>
                    </div>
                </div>

                <div className="form-group">
                    <label>密码</label>
                    <input
                        type="password"
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        placeholder="请设置密码 (至少6位)"
                        minLength={6}
                        required
                    />
                </div>

                <div className="form-group">
                    <label>确认密码</label>
                    <input
                        type="password"
                        name="confirmPassword"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        placeholder="请再次输入密码"
                        minLength={6}
                        required
                    />
                </div>

                <button type="submit" className="submit-btn">注册</button>
            </form>

            <div className="form-footer">
                已有账号？
                <button
                    type="button"
                    className="text-link"
                    onClick={() => document.querySelector('.auth-tabs button:nth-child(1)').click()}
                >
                    立即登录
                </button>
            </div>
        </div>
    );
};

export default RegisterForm; 