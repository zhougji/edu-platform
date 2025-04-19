const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const morgan = require('morgan');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
const dotenv = require('dotenv');
const fs = require('fs');
const { testConnection, initDb } = require('./config/db');

// 加载环境变量
dotenv.config();

// 确保数据目录存在
const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
}

// 初始化 Express 应用
const app = express();
const server = http.createServer(app);

// 提取 CORS 配置到常量
const ALLOWED_ORIGINS = [
    process.env.STUDENT_APP_URL || 'http://localhost:8081',
    process.env.TEACHER_APP_URL || 'http://localhost:8080'
];

const io = socketIo(server, {
    cors: {
        origin: ALLOWED_ORIGINS,
        methods: ["GET", "POST"],
        credentials: true
    }
});

// --- 中间件配置 ---
app.use(cors({
    origin: function (origin, callback) {
        if (!origin) return callback(null, true);
        if (ALLOWED_ORIGINS.indexOf(origin) === -1) {
            const msg = '此来源的CORS策略不允许访问.';
            return callback(new Error(msg), false);
        }
        return callback(null, true);
    },
    credentials: true
}));

app.use(morgan('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// --- 服务静态文件 ---
app.use(express.static(path.join(__dirname, '../public')));
app.use(express.static(path.join(__dirname, 'public'))); // 服务器端公共文件
app.use('/student-app', express.static(path.join(__dirname, '../student-app/dist'))); // 学生应用
app.use('/teacher-app', express.static(path.join(__dirname, '../teacher-app/dist'))); // 教师应用

// 主页路由，重定向到登录页
app.get('/', (req, res) => {
    res.redirect('/login.html');
});

// 存储在线咨询请求
const consultationRequests = [];

// 优化统计函数
const getConsultationStats = () => {
    const stats = { pending: 0, completed: 0, total: consultationRequests.length };
    consultationRequests.forEach(req => {
        if (req.status === 'pending') stats.pending++;
        if (req.status === 'completed') stats.completed++;
    });
    return stats;
};

// 广播统计数据
const broadcastConsultationStats = () => {
    io.to('teacher').emit('consultation_stats', getConsultationStats());
};

// WebSocket连接处理
io.on('connection', (socket) => {
    console.log('新的客户端连接：', socket.id);

    socket.on('authenticate', (data) => {
        socket.userId = data.userId;
        socket.userRole = data.role;
        socket.join(data.role);

        if (data.role === 'teacher') {
            socket.emit('pending_requests', consultationRequests.filter(req => req.status === 'pending'));
            socket.emit('consultation_stats', getConsultationStats());
        }
    });

    // 学生发起咨询请求
    socket.on('create_consultation', (data) => {
        if (socket.userRole !== 'student') return;

        console.log('收到咨询请求：', data);
        const requestId = Date.now().toString(); // 简单生成唯一ID

        const request = {
            id: requestId,
            studentId: socket.userId,
            studentName: data.studentName,
            topic: data.topic,
            message: data.message,
            status: 'pending',
            createdAt: new Date(),
            updatedAt: new Date()
        };

        // 保存请求
        consultationRequests.push(request);

        // 通知所有教师
        io.to('teacher').emit('new_consultation_request', request);

        // 更新并广播统计数据
        broadcastConsultationStats();

        // 确认学生请求已收到
        socket.emit('consultation_created', {
            success: true,
            requestId: requestId
        });
    });

    // 教师接受咨询请求
    socket.on('accept_consultation', (data) => {
        if (socket.userRole !== 'teacher') return;

        console.log('教师接受咨询：', data);
        const requestId = data.requestId;
        const request = consultationRequests.find(req => req.id === requestId);

        if (request && request.status === 'pending') {
            request.status = 'accepted';
            request.teacherId = socket.userId;
            request.teacherName = data.teacherName;
            request.updatedAt = new Date();

            // 创建咨询会话室
            const roomId = `consultation_${requestId}`;

            // 通知学生请求已被接受
            io.sockets.sockets.forEach(s => {
                if (s.userId === request.studentId) {
                    s.join(roomId);
                    s.emit('consultation_accepted', {
                        requestId: requestId,
                        teacherName: data.teacherName,
                        roomId: roomId
                    });
                }
            });

            // 教师加入咨询会话室
            socket.join(roomId);

            // 更新所有教师的待处理请求列表
            io.to('teacher').emit('pending_requests', consultationRequests.filter(req => req.status === 'pending'));

            // 更新并广播统计数据
            broadcastConsultationStats();
        }
    });

    // 处理咨询消息
    socket.on('consultation_message', (data) => {
        const roomId = `consultation_${data.requestId}`;
        io.to(roomId).emit('consultation_message', {
            senderId: socket.userId,
            senderRole: socket.userRole,
            senderName: data.senderName,
            message: data.message,
            timestamp: new Date()
        });
    });

    // 结束咨询
    socket.on('end_consultation', (data) => {
        const requestId = data.requestId;
        const request = consultationRequests.find(req => req.id === requestId);

        if (request && (request.status === 'accepted' || request.status === 'pending')) {
            request.status = 'completed';
            request.updatedAt = new Date();
            request.endedBy = socket.userRole;
            request.endReason = data.reason || '咨询完成';

            const roomId = `consultation_${requestId}`;

            // 通知房间内所有人咨询已结束
            io.to(roomId).emit('consultation_ended', {
                requestId: requestId,
                endedBy: socket.userRole,
                reason: data.reason || '咨询完成'
            });

            // 更新所有教师的待处理和已处理请求列表
            io.to('teacher').emit('pending_requests', consultationRequests.filter(req => req.status === 'pending'));
            io.to('teacher').emit('completed_requests', consultationRequests.filter(req => req.status === 'completed'));

            // 更新并广播统计数据
            broadcastConsultationStats();
        }
    });

    // 断开连接处理
    socket.on('disconnect', () => {
        console.log('客户端断开连接：', socket.id);
    });
});

// --- 切换使用文件存储模块 ---
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/teachers', require('./routes/teacherRoutes'));
app.use('/api/resources', require('./routes/resources'));
app.use('/api/consultations', require('./routes/consultations'));
app.use('/api/ai-learning', require('./routes/ai-learning'));

// 简化咨询请求API
app.get('/api/consultations/requests', (req, res) => {
    res.json({
        pending: consultationRequests.filter(req => req.status === 'pending'),
        stats: getConsultationStats()
    });
});

// 简化仪表板数据API
app.get('/api/teacher/dashboard', (req, res) => {
    res.json({
        pendingRequestCount: consultationRequests.filter(req => req.status === 'pending').length,
        pendingRequests: consultationRequests.filter(req => req.status === 'pending')
    });
});

// --- Catch-all route for SPAs ---
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../public', 'index.html'));
});

// 直接启动服务器，不使用数据库初始化
const PORT = process.env.PORT || 5000;

// 数据库初始化和服务器启动
testConnection()
    .then(() => initDb())
    .then((dbInitialized) => {
        server.listen(PORT, () => {
            if (dbInitialized) {
                console.log(`服务器运行在端口 ${PORT} (使用MySQL数据库模式)`);
            } else {
                console.log(`服务器运行在端口 ${PORT} (使用临时文件存储模式)`);
            }
        });
    })
    .catch(err => {
        console.error('数据库连接或初始化失败，但服务器仍将启动:', err);
        // 捕获错误但仍然启动服务器
        server.listen(PORT, () => {
            console.log(`服务器运行在端口 ${PORT} (使用临时文件存储模式)`);
        });
    }); 