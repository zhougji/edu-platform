// 在现有的路由引入后添加
const aiChatsRoutes = require('./routes/aiChats');

// 在其他路由挂载后添加
app.use('/api/ai', aiChatsRoutes); 