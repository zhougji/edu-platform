const express = require('express');
const {
    getTeacherProfile,
    updateTeacherProfile,
    uploadVideo,
    getVideos,
    getStudentRequests,
} = require('../controllers/teacherController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// 应用保护和角色授权中间件到所有教师路由
router.use(protect, authorize('teacher'));

// 定义路由并关联 Controller 函数
router.get('/profile', getTeacherProfile);
router.put('/profile', updateTeacherProfile);
router.post('/videos', uploadVideo);
router.get('/videos', getVideos);
router.get('/consultation-requests', getStudentRequests);

// 导出路由
module.exports = router; 