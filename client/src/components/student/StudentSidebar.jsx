import React from 'react';
import { NavLink } from 'react-router-dom';

const StudentSidebar = () => {
    return (
        <div className="student-sidebar">
            <div className="sidebar-header">
                <img src="/logo.png" alt="启明隅教育" className="sidebar-logo" />
                <h3>启明隅教育</h3>
            </div>
            <ul className="sidebar-menu">
                <li>
                    <NavLink to="/student/dashboard" className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}>
                        <i className="fas fa-tachometer-alt"></i>
                        <span>学习中心</span>
                    </NavLink>
                </li>
                <li>
                    <NavLink to="/student/resources" className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}>
                        <i className="fas fa-book-open"></i>
                        <span>学习资源</span>
                    </NavLink>
                </li>
                <li>
                    <NavLink to="/student/consultations" className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}>
                        <i className="fas fa-comments"></i>
                        <span>在线咨询</span>
                    </NavLink>
                </li>
                <li>
                    <NavLink to="/student/ai" className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}>
                        <i className="fas fa-robot"></i>
                        <span>AI学习助手</span>
                    </NavLink>
                </li>
                <li>
                    <NavLink to="/student/profile" className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}>
                        <i className="fas fa-user-circle"></i>
                        <span>个人中心</span>
                    </NavLink>
                </li>
            </ul>
            <div className="sidebar-footer">
                <p>启明隅教育 © {new Date().getFullYear()}</p>
                <p>点亮学习之路</p>
            </div>
        </div>
    );
};

export default StudentSidebar; 