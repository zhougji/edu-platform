const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const http = require('http');
const socketIo = require('socket.io');
const dotenv = require('dotenv');

// 加载环境变量
dotenv.config();

// 引入中间件
const logger = require('./middleware/logger');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
        origin: ['http://localhost:8080', 'http://localhost:8081'],
        methods: ['GET', 'POST'],
        credentials: true
    }
});

// 中间件
app.use(cors({
    origin: ['http://localhost:8080', 'http://localhost:8081'],
    credentials: true
}));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use('/uploads', express.static('uploads'));

// 日志中间件 - 记录所有请求
app.use(logger);

// 数据库连接
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/edu-platform', {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
    .then(() => {
        console.log('MongoDB 连接成功');
    })
    .catch(err => {
        console.error('MongoDB 连接失败:', err);
    });

// JWT 密钥
const JWT_SECRET = 'education-resource-distribution-platform-secret';

// JWT 认证中间件
const authenticateJWT = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (authHeader) {
        const token = authHeader.split(' ')[1];
        jwt.verify(token, JWT_SECRET, (err, user) => {
            if (err) {
                return res.status(403).json({ message: '认证失败，请重新登录' });
            }
            req.user = user;
            next();
        });
    } else {
        res.status(401).json({ message: '未授权，请登录' });
    }
};

// 路由
const authRoutes = require('./routes/auth');
const studentRoutes = require('./routes/students');
const teacherRoutes = require('./routes/teachers');
const resourceRoutes = require('./routes/resources');
const consultationRoutes = require('./routes/consultations');
const aiLearningRoutes = require('./routes/ai-learning');
const adminStatsRoutes = require('./routes/admin-stats');
const learningTimeRoutes = require('./routes/learning-time');

app.use('/api/auth', authRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/teachers', teacherRoutes);
app.use('/api/resources', resourceRoutes);
app.use('/api/consultations', consultationRoutes);
app.use('/api/ai-learning', aiLearningRoutes);
app.use('/api/admin/stats', adminStatsRoutes);
app.use('/api/learning-time', learningTimeRoutes);

// AI 辅助学习 API
app.get('/api/ai-learning', (req, res) => {
    const aiSuggestions = [
        "我注意到你最近在数学方面有些困难，建议观看'函数基础'视频并完成相关练习。",
        "根据你的学习记录，你在英语词汇方面进步很快，建议尝试更高级的阅读材料。",
        "你在物理实验方面表现出了很强的天赋，推荐参加下周的实验班。",
        "最近几次测验显示你对几何问题有些困难，建议寻求老师额外辅导。",
        "你的学习数据显示你是视觉学习者，建议使用更多图表和视频资源来学习新概念。",
        "根据你的学习习惯分析，建议你在早上进行复习，效果会更好。",
        "你在小组讨论中表现活跃，推荐参与更多合作学习活动以提高学习效果。"
    ];

    // 随机选择一条建议
    const randomSuggestion = aiSuggestions[Math.floor(Math.random() * aiSuggestions.length)];

    res.json({ message: randomSuggestion });
});

// WebSocket 处理咨询消息实时通信
io.on('connection', (socket) => {
    console.log('用户已连接：', socket.id);

    // 学生或老师加入咨询聊天室
    socket.on('join-consultation', (consultationId) => {
        socket.join(`consultation-${consultationId}`);
        console.log(`用户 ${socket.id} 加入咨询 ${consultationId}`);
    });

    // 处理新消息
    socket.on('new-message', (data) => {
        io.to(`consultation-${data.consultationId}`).emit('message', data);
        console.log(`咨询 ${data.consultationId} 中的新消息：`, data.content);
    });

    // 通知老师新的咨询请求
    socket.on('new-consultation-request', (data) => {
        io.emit('consultation-request', data);
        console.log('新咨询请求：', data);
    });

    // 学生收到老师接受咨询的通知
    socket.on('consultation-accepted', (data) => {
        io.emit('student-consultation-accepted', data);
        console.log('咨询已接受：', data);
    });

    socket.on('disconnect', () => {
        console.log('用户已断开连接：', socket.id);
    });
});

// 404 处理
app.use((req, res) => {
    res.status(404).json({ message: '未找到请求的资源' });
});

// 错误处理
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ message: '服务器错误' });
});

// 启动服务器
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
    console.log(`服务器运行在端口 ${PORT}`);
});

// 设置每日统计数据重置任务
const resetDailyStats = () => {
    global.systemPerfStats = {
        apiCalls: 0,
        totalResponseTime: 0,
        avgResponseTime: 0,
        errors: 0
    };
};

// 每天午夜重置统计数据
setInterval(resetDailyStats, 24 * 60 * 60 * 1000);
// 初始化统计数据
resetDailyStats();

module.exports = app;
