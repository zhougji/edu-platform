import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import AiAssistant from './pages/student/AiAssistant';
import AiChatPage from './pages/student/AiChatPage';
import ConsultationDetail from './pages/student/ConsultationDetail';
import ConsultationFeedback from './pages/student/ConsultationFeedback';
import ConsultationRoom from './pages/student/ConsultationRoom';
import ConsultationList from './pages/student/ConsultationList';

function App() {
    return (
        <Router>
            <Routes>
                {/* 公共路由 */}
                <Route path="/" element={
                    <div className="welcome-container">
                        <h1>欢迎来到启明隅教育平台</h1>
                        <p className="welcome-desc">专注于为学生提供高质量在线教育资源与服务</p>
                        <div className="feature-container">
                            <div className="feature">
                                <i className="fas fa-book-open"></i>
                                <h3>在线资源</h3>
                                <p>丰富的学习资料，覆盖多学科内容</p>
                            </div>
                            <div className="feature">
                                <i className="fas fa-comments"></i>
                                <h3>在线咨询</h3>
                                <p>专业教师一对一解答学习疑问</p>
                            </div>
                            <div className="feature">
                                <i className="fas fa-robot"></i>
                                <h3>AI辅助学习</h3>
                                <p>智能学习助手随时为您服务</p>
                            </div>
                        </div>
                        <div className="action-buttons">
                            <Link to="/login" className="login-btn">登录</Link>
                            <Link to="/register" className="register-btn">注册</Link>
                        </div>
                    </div>
                } />

                {/* 学生路由 */}
                <Route path="/student/ai" element={<ProtectedRoute role="student"><AiAssistant /></ProtectedRoute>} />
                <Route path="/student/ai/new" element={<ProtectedRoute role="student"><AiChatPage /></ProtectedRoute>} />
                <Route path="/student/ai/chat/:id" element={<ProtectedRoute role="student"><AiChatPage /></ProtectedRoute>} />
                <Route path="/student/consultations" element={<ProtectedRoute role="student"><ConsultationList /></ProtectedRoute>} />
                <Route path="/student/consultation/detail/:id" element={<ProtectedRoute role="student"><ConsultationDetail /></ProtectedRoute>} />
                <Route path="/student/consultation/feedback/:id" element={<ProtectedRoute role="student"><ConsultationFeedback /></ProtectedRoute>} />
                <Route path="/student/consultation/room/:id" element={<ProtectedRoute role="student"><ConsultationRoom /></ProtectedRoute>} />
            </Routes>
        </Router>
    );
}

export default App; 