import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import LoginForm from '../components/auth/LoginForm';
import RegisterForm from '../components/auth/RegisterForm';
import Carousel from '../components/ui/Carousel';

const Landing = () => {
    const [activeTab, setActiveTab] = useState('login');
    const [userType, setUserType] = useState('student');

    const carouselItems = [
        {
            image: '/images/carousel/slide1.jpg',
            title: '欢迎来到启明隅',
            description: '连接偏远地区学生与优质教育资源的桥梁'
        },
        {
            image: '/images/carousel/slide2.jpg',
            title: '个性化学习体验',
            description: '根据学生需求定制学习资源，AI辅助学习全天候'
        },
        {
            image: '/images/carousel/slide3.jpg',
            title: '优质师资力量',
            description: '来自全国各地的优秀教师为你答疑解惑'
        }
    ];

    return (
        <div className="landing-page">
            <header className="header">
                <div className="logo">
                    <h1>启明隅</h1>
                </div>
                <div className="auth-nav">
                    <button
                        className={userType === 'student' ? 'active' : ''}
                        onClick={() => setUserType('student')}
                    >
                        学生入口
                    </button>
                    <button
                        className={userType === 'teacher' ? 'active' : ''}
                        onClick={() => setUserType('teacher')}
                    >
                        教师入口
                    </button>
                </div>
            </header>

            <main className="main-content">
                <div className="carousel-section">
                    <Carousel items={carouselItems} />
                </div>

                <div className="auth-section">
                    <div className="auth-tabs">
                        <button
                            className={activeTab === 'login' ? 'active' : ''}
                            onClick={() => setActiveTab('login')}
                        >
                            登录
                        </button>
                        <button
                            className={activeTab === 'register' ? 'active' : ''}
                            onClick={() => setActiveTab('register')}
                        >
                            注册
                        </button>
                    </div>

                    <div className="auth-form-container">
                        {activeTab === 'login' ? (
                            <LoginForm userType={userType} />
                        ) : (
                            <RegisterForm userType={userType} />
                        )}
                    </div>
                </div>
            </main>

            <footer className="footer">
                <p>&copy; {new Date().getFullYear()} 启明隅教育 - 连接知识，照亮未来</p>
                <p>域名: <a href="https://luminook.xyz">luminook.xyz</a> | <a href="https://qimingyu.xyz">qimingyu.xyz</a></p>
            </footer>
        </div>
    );
};

export default Landing; 