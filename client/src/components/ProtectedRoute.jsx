import React from 'react';
import { Navigate } from 'react-router-dom';
import { getCurrentUser } from '../services/authService';

const ProtectedRoute = ({ children, role }) => {
    const currentUser = getCurrentUser();

    // 检查用户是否登录
    if (!currentUser) {
        return <Navigate to="/login" replace />;
    }

    // 检查用户角色是否匹配
    if (role && currentUser.role !== role) {
        return <Navigate to="/" replace />;
    }

    return children;
};

export default ProtectedRoute; 