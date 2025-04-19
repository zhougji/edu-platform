const express = require('express');
const {
    getAvailableConsultations,
    requestConsultation,
    getConsultationDetails,
    updateConsultationStatus
} = require('../controllers/consultationController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// 获取可用咨询/教师列表 (学生)
router.get('/', protect, authorize('student'), getAvailableConsultations);

// 学生发起咨询请求
router.post('/request/:teacherId', protect, authorize('student'), requestConsultation);

// 获取特定咨询详情 (学生或教师)
router.get('/:id', protect, getConsultationDetails); // Controller 内部应检查用户是否关联

// 更新咨询状态 (通常由教师操作，但学生可能取消?)
router.put('/:id/status', protect, updateConsultationStatus); // Controller 内部应检查权限

module.exports = router; 