// server/controllers/aiController.js

// @desc    处理 AI 聊天请求 (Placeholder)
// @route   POST /api/ai-learning/chat
// @access  Private (Student)
exports.processAiChat = async (req, res, next) => {
    const { message, history } = req.body;
    const userId = req.user.id;
    console.log(`[POST /api/ai-learning/chat] 用户 ${userId} 发起 AI 聊天:`, message);
    // TODO: 实现调用 DeepSeek 或其他 AI 模型的逻辑
    res.status(200).json({
        success: true,
        reply: "你好！我是启明隅AI助手，目前还在学习中。你刚才说：" + message
    }); // 返回一个简单的占位回复
}; 