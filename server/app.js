const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const http = require('http');
const socketIo = require('socket.io');
const morgan = require('morgan');
const dotenv = require('dotenv');

// 加载环境变量
dotenv.config();

// 导入中间件
const errorHandler = require('./middleware/errorHandler');
const { rateLimiter } = require('./middleware/auth');

// 初始化Express应用
const app = express();
const server = http.createServer(app);

// 设置CORS
app.use(cors({
    origin: process.env.CLIENT_URL || 'http://localhost:8080',
    credentials: true
}));

// 请求日志
app.use(morgan('dev'));

// 请求限流
app.use(rateLimiter);

// 请求体解析
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// 静态文件服务
const uploadDir = process.env.UPLOAD_DIR || 'uploads';
app.use(`/${uploadDir}`, express.static(path.join(__dirname, uploadDir)));

// 连接MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/edu-platform', {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
    .then(() => console.log('MongoDB 连接成功'))
    .catch(err => {
        console.error('MongoDB 连接失败:', err);
        process.exit(1);
    });

// 路由
app.use('/api/auth', require('./routes/auth'));
app.use('/api/resources', require('./routes/resources'));
app.use('/api/consultations', require('./routes/consultations'));
app.use('/api/ai-learning', require('./routes/ai-learning'));

// API根路径信息
app.get('/api', (req, res) => {
    res.json({
        success: true,
        message: '教育平台API服务',
        version: '1.0.0',
        endpoints: [
            '/api/auth',
            '/api/resources',
            '/api/consultations',
            '/api/ai-learning'
        ]
    });
});

// 健康检查端点
app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        uptime: process.uptime(),
        timestamp: Date.now(),
        environment: process.env.NODE_ENV,
        database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
    });
});

// 404处理
app.use((req, res, next) => {
    res.status(404).json({
        success: false,
        message: '请求的资源不存在'
    });
});

// 全局错误处理
app.use(errorHandler);

// WebSocket实时通信设置
const io = socketIo(server, {
    cors: {
        origin: process.env.CLIENT_URL || 'http://localhost:8080',
        methods: ['GET', 'POST'],
        credentials: true
    }
});

// 在线咨询的WebSocket处理
const consultationNamespace = io.of('/consultations');

consultationNamespace.on('connection', (socket) => {
    console.log('用户连接到咨询服务:', socket.id);

    // 加入特定咨询房间
    socket.on('join-consultation', (consultationId) => {
        socket.join(`consultation-${consultationId}`);
        console.log(`用户 ${socket.id} 加入咨询 ${consultationId}`);
    });

    // 发送消息
    socket.on('send-message', (data) => {
        const { consultationId, message } = data;
        console.log(`向咨询 ${consultationId} 发送消息`);

        // 广播给房间内所有人
        consultationNamespace.to(`consultation-${consultationId}`).emit('new-message', message);
    });

    // 视频通话信令
    socket.on('video-signal', (data) => {
        const { consultationId, signal, to } = data;
        console.log(`咨询 ${consultationId} 中的视频信号`);

        // 将信号转发给特定用户
        socket.to(`consultation-${consultationId}`).emit('video-signal', {
            from: socket.id,
            signal
        });
    });

    // 状态更新
    socket.on('status-update', (data) => {
        const { consultationId, status } = data;
        console.log(`咨询 ${consultationId} 状态更新为 ${status}`);

        consultationNamespace.to(`consultation-${consultationId}`).emit('status-changed', status);
    });

    // 断开连接
    socket.on('disconnect', () => {
        console.log('用户断开连接:', socket.id);
    });
});

// 启动服务器
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
    console.log(`服务器运行在端口 ${PORT}`);
    console.log(`访问: http://localhost:${PORT}/api`);
});

process.on('unhandledRejection', (err) => {
    console.error('未处理的Promise拒绝:', err);
});

module.exports = { app, server };