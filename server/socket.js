const socketio = require('socket.io');
const jwt = require('jsonwebtoken');
const config = require('./config/config');
const User = require('./models/User');
const Consultation = require('./models/Consultation');

module.exports = (server) => {
    const io = socketio(server);

    // 用户认证中间件
    io.use(async (socket, next) => {
        try {
            const token = socket.handshake.auth.token || socket.handshake.query.token;

            if (!token) {
                return next(new Error('认证失败'));
            }

            // 验证JWT
            const decoded = jwt.verify(token, config.JWT_SECRET);

            // 获取用户信息
            const user = await User.findById(decoded.id).select('-password');

            if (!user) {
                return next(new Error('用户不存在'));
            }

            // 将用户信息存储到socket对象
            socket.user = user;
            next();
        } catch (err) {
            return next(new Error('认证失败'));
        }
    });

    // 连接处理
    io.on('connection', (socket) => {
        console.log(`用户已连接: ${socket.user.name}, ID: ${socket.user._id}`);

        // 加入用户私人房间
        socket.join(`user:${socket.user._id}`);

        // 更新用户在线状态
        socket.user.isOnline = true;
        socket.user.save({ validateBeforeSave: false });

        // 处理新咨询请求
        socket.on('consultation:request', async (data) => {
            try {
                const { consultationId } = data;
                const consultation = await Consultation.findById(consultationId)
                    .populate('student', 'name avatar')
                    .populate('teacher', 'name avatar');

                if (!consultation) {
                    return socket.emit('error', { message: '咨询不存在' });
                }

                // 向教师发送新的咨询请求通知
                io.to(`user:${consultation.teacher._id}`).emit('consultation:new', {
                    consultation
                });
            } catch (error) {
                console.error('处理咨询请求错误:', error);
                socket.emit('error', { message: '服务器错误' });
            }
        });

        // 处理咨询状态更新
        socket.on('consultation:status', async (data) => {
            try {
                const { consultationId, status } = data;
                const consultation = await Consultation.findById(consultationId)
                    .populate('student', 'name avatar')
                    .populate('teacher', 'name avatar');

                if (!consultation) {
                    return socket.emit('error', { message: '咨询不存在' });
                }

                // 验证用户是否为该咨询的教师
                if (consultation.teacher._id.toString() !== socket.user._id.toString()) {
                    return socket.emit('error', { message: '无权更新此咨询状态' });
                }

                // 更新状态
                consultation.status = status;
                await consultation.save();

                // 向学生发送状态更新通知
                io.to(`user:${consultation.student._id}`).emit('consultation:status', {
                    consultation
                });

                // 如果接受了咨询，创建一个咨询房间
                if (status === 'accepted') {
                    const roomId = `consultation:${consultation._id}`;
                    // 将教师加入咨询房间
                    socket.join(roomId);
                    // 通知学生可以加入咨询
                    io.to(`user:${consultation.student._id}`).emit('consultation:ready', {
                        consultation,
                        roomId
                    });
                }
            } catch (error) {
                console.error('更新咨询状态错误:', error);
                socket.emit('error', { message: '服务器错误' });
            }
        });

        // 加入咨询房间
        socket.on('consultation:join', async (data) => {
            try {
                const { consultationId } = data;
                const consultation = await Consultation.findById(consultationId);

                if (!consultation) {
                    return socket.emit('error', { message: '咨询不存在' });
                }

                // 验证用户是否为该咨询的参与者
                const isParticipant = (
                    consultation.student.toString() === socket.user._id.toString() ||
                    consultation.teacher.toString() === socket.user._id.toString()
                );

                if (!isParticipant) {
                    return socket.emit('error', { message: '无权加入此咨询' });
                }

                const roomId = `consultation:${consultation._id}`;
                socket.join(roomId);

                // 通知房间内其他用户有新参与者加入
                socket.to(roomId).emit('consultation:user_joined', {
                    user: {
                        _id: socket.user._id,
                        name: socket.user.name,
                        avatar: socket.user.avatar,
                        role: socket.user.role
                    }
                });

                // 发送历史消息
                socket.emit('consultation:history', {
                    messages: consultation.messages
                });
            } catch (error) {
                console.error('加入咨询错误:', error);
                socket.emit('error', { message: '服务器错误' });
            }
        });

        // 发送咨询消息
        socket.on('consultation:message', async (data) => {
            try {
                const { consultationId, content } = data;
                const consultation = await Consultation.findById(consultationId);

                if (!consultation) {
                    return socket.emit('error', { message: '咨询不存在' });
                }

                // 验证用户是否为该咨询的参与者
                const isParticipant = (
                    consultation.student.toString() === socket.user._id.toString() ||
                    consultation.teacher.toString() === socket.user._id.toString()
                );

                if (!isParticipant) {
                    return socket.emit('error', { message: '无权在此咨询中发送消息' });
                }

                // 验证咨询状态是否允许发送消息
                if (consultation.status !== 'accepted') {
                    return socket.emit('error', {
                        message: `咨询状态为"${consultation.status}"，无法发送消息`
                    });
                }

                // 添加消息
                const message = {
                    sender: socket.user._id,
                    content,
                    timestamp: new Date(),
                    read: false
                };

                consultation.messages.push(message);
                await consultation.save();

                // 获取完整的消息对象（包括发送者信息）
                const populatedConsultation = await Consultation.findById(consultationId)
                    .populate('messages.sender', 'name avatar role');

                const newMessage = populatedConsultation.messages[
                    populatedConsultation.messages.length - 1
                ];

                // 广播消息到咨询房间
                const roomId = `consultation:${consultation._id}`;
                io.to(roomId).emit('consultation:message', {
                    message: newMessage
                });
            } catch (error) {
                console.error('发送咨询消息错误:', error);
                socket.emit('error', { message: '服务器错误' });
            }
        });

        // 标记消息为已读
        socket.on('consultation:read', async (data) => {
            try {
                const { consultationId, messageIds } = data;
                const consultation = await Consultation.findById(consultationId);

                if (!consultation) {
                    return socket.emit('error', { message: '咨询不存在' });
                }

                // 验证用户是否为该咨询的参与者
                const isParticipant = (
                    consultation.student.toString() === socket.user._id.toString() ||
                    consultation.teacher.toString() === socket.user._id.toString()
                );

                if (!isParticipant) {
                    return socket.emit('error', { message: '无权操作此咨询的消息' });
                }

                // 标记消息为已读
                let updated = false;
                consultation.messages.forEach(message => {
                    if (messageIds.includes(message._id.toString()) &&
                        message.sender.toString() !== socket.user._id.toString() &&
                        !message.read) {
                        message.read = true;
                        updated = true;
                    }
                });

                if (updated) {
                    await consultation.save();

                    // 通知对方消息已读
                    const roomId = `consultation:${consultation._id}`;
                    socket.to(roomId).emit('consultation:read', {
                        messageIds
                    });
                }
            } catch (error) {
                console.error('标记消息已读错误:', error);
                socket.emit('error', { message: '服务器错误' });
            }
        });

        // 结束咨询
        socket.on('consultation:end', async (data) => {
            try {
                const { consultationId } = data;
                const consultation = await Consultation.findById(consultationId);

                if (!consultation) {
                    return socket.emit('error', { message: '咨询不存在' });
                }

                // 验证用户是否为该咨询的教师
                if (consultation.teacher.toString() !== socket.user._id.toString()) {
                    return socket.emit('error', { message: '只有教师可以结束咨询' });
                }

                // 验证咨询状态
                if (consultation.status !== 'accepted') {
                    return socket.emit('error', {
                        message: `咨询状态为"${consultation.status}"，无法结束`
                    });
                }

                // 更新状态为已完成
                consultation.status = 'completed';
                await consultation.save();

                // 通知双方咨询已结束
                const roomId = `consultation:${consultation._id}`;
                io.to(roomId).emit('consultation:ended', {
                    consultation: {
                        _id: consultation._id,
                        status: consultation.status
                    }
                });
            } catch (error) {
                console.error('结束咨询错误:', error);
                socket.emit('error', { message: '服务器错误' });
            }
        });

        // 断开连接处理
        socket.on('disconnect', async () => {
            console.log(`用户已断开连接: ${socket.user.name}, ID: ${socket.user._id}`);

            // 更新用户离线状态
            socket.user.isOnline = false;
            socket.user.lastActive = new Date();
            await socket.user.save({ validateBeforeSave: false });
        });
    });

    return io;
}; 