const userStore = require('../utils/mysqlUserStore');

// @desc    获取当前教师的完整个人资料 (未来可能包含学生请求等)
// @route   GET /api/teachers/profile (假设)
// @access  Private (Teacher)
exports.getTeacherProfile = async (req, res, next) => {
    // req.user 由 protect 中间件设置
    // 在 mysqlUserStore 中，我们可能需要根据 ID 再次查找以获取最新信息
    const teacher = userStore.findUserById(req.user.id);
    if (!teacher || teacher.role !== 'teacher') {
        return res.status(404).json({ success: false, message: '未找到教师信息' });
    }
    // 移除敏感信息再发送
    const { password, tokens, ...profile } = teacher;
    res.status(200).json({ success: true, data: profile });
};

// @desc    更新当前教师的个人资料
// @route   PUT /api/teachers/profile
// @access  Private (Teacher)
exports.updateTeacherProfile = async (req, res, next) => {
    const { realName, subject, description /* 其他可更新字段 */ } = req.body;
    const teacherId = req.user.id; // 从 protect 中间件获取

    console.log(`[PUT /api/teachers/profile] 更新教师 ${teacherId} 的资料:`, req.body);

    const updates = { realName, subject, description };
    // 过滤掉 undefined 的字段，防止覆盖已有值
    Object.keys(updates).forEach(key => updates[key] === undefined && delete updates[key]);

    const updatedTeacher = userStore.updateUser(teacherId, updates);

    if (!updatedTeacher) {
        console.error(`[PUT /api/teachers/profile] 更新教师 ${teacherId} 失败`);
        return res.status(404).json({ success: false, message: '更新失败，未找到教师或保存出错' });
    }

    console.log(`[PUT /api/teachers/profile] 教师 ${teacherId} 资料更新成功`);
    res.status(200).json({ success: true, data: updatedTeacher });
};

// @desc    上传视频 (Placeholder)
// @route   POST /api/teachers/videos
// @access  Private (Teacher)
exports.uploadVideo = async (req, res, next) => {
    console.log(`[POST /api/teachers/videos] 教师 ${req.user.id} 尝试上传视频:`, req.body, req.file);
    // TODO: 实现文件上传逻辑，保存文件信息等
    res.status(501).json({ success: false, message: '视频上传功能暂未实现' });
};

// @desc    获取教师上传的视频列表 (Placeholder)
// @route   GET /api/teachers/videos
// @access  Private (Teacher)
exports.getVideos = async (req, res, next) => {
    console.log(`[GET /api/teachers/videos] 教师 ${req.user.id} 请求视频列表`);
    // TODO: 实现获取视频列表逻辑
    res.status(200).json({ success: true, data: [] }); // 返回空列表作为占位符
};

// @desc    获取向该教师发起的学生咨询请求 (Placeholder)
// @route   GET /api/teachers/consultation-requests
// @access  Private (Teacher)
exports.getStudentRequests = async (req, res, next) => {
    console.log(`[GET /api/teachers/consultation-requests] 教师 ${req.user.id} 请求学生咨询列表`);
    // TODO: 实现获取咨询请求列表逻辑
    res.status(200).json({ success: true, data: [] }); // 返回空列表作为占位符
}; 