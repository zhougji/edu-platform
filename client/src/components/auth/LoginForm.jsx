import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login, loginWithVerification } from '../../services/authService';

const LoginForm = ({ userType }) => {
    const navigate = useNavigate();
    const [loginMethod, setLoginMethod] = useState('password'); // password 或 verification
    const [contactType, setContactType] = useState('phone');
    const [contact, setContact] = useState('');
    const [password, setPassword] = useState('');
    const [verificationCode, setVerificationCode] = useState('');
    const [isCodeSent, setIsCodeSent] = useState(false);
    const [countdown, setCountdown] = useState(0);
    const [error, setError] = useState('');

    const handleSendVerificationCode = async () => {
        try {
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
            let result;

            if (loginMethod === 'password') {
                result = await login(contactType, contact, password);
            } else {
                result = await loginWithVerification(contactType, contact, verificationCode);
            }

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
        <div className="login-form">
            <h2>{userType === 'student' ? '学生登录' : '教师登录'}</h2>

            <div className="login-method-tabs">
                <button
                    className={loginMethod === 'password' ? 'active' : ''}
                    onClick={() => setLoginMethod('password')}
                >
                    密码登录
                </button>
                <button
                    className={loginMethod === 'verification' ? 'active' : ''}
                    onClick={() => setLoginMethod('verification')}
                >
                    验证码登录
                </button>
            </div>

            {error && <div className="error-message">{error}</div>}

            <form onSubmit={handleSubmit}>
                <div className="form-group">
                    <label>登录方式</label>
                    <div className="contact-type-selector">
                        <button
                            type="button"
                            className={contactType === 'phone' ? 'active' : ''}
                            onClick={() => setContactType('phone')}
                        >
                            手机号
                        </button>
                        <button
                            type="button"
                            className={contactType === 'email' ? 'active' : ''}
                            onClick={() => setContactType('email')}
                        >
                            邮箱
                        </button>
                    </div>
                </div>

                <div className="form-group">
                    <label>{contactType === 'phone' ? '手机号' : '邮箱'}</label>
                    <input
                        type={contactType === 'phone' ? 'tel' : 'email'}
                        value={contact}
                        onChange={(e) => setContact(e.target.value)}
                        placeholder={contactType === 'phone' ? '请输入手机号' : '请输入邮箱'}
                        required
                    />
                </div>

                {loginMethod === 'password' ? (
                    <div className="form-group">
                        <label>密码</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="请输入密码"
                            required
                        />
                    </div>
                ) : (
                    <div className="form-group verification-code">
                        <label>验证码</label>
                        <div className="code-input-container">
                            <input
                                type="text"
                                value={verificationCode}
                                onChange={(e) => setVerificationCode(e.target.value)}
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
                )}

                <button type="submit" className="submit-btn">登录</button>
            </form>

            <div className="form-footer">
                还没有账号？
                <button
                    type="button"
                    className="text-link"
                    onClick={() => document.querySelector('.auth-tabs button:nth-child(2)').click()}
                >
                    立即注册
                </button>
            </div>
        </div>
    );
};

export default LoginForm; 