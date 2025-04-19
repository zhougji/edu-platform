const mysql = require('mysql2/promise');
const dotenv = require('dotenv');

// 加载环境变量
dotenv.config();

// 打印配置信息(不包含密码)
console.log('尝试连接到数据库:');
console.log(`Host: ${process.env.DB_HOST}`);
console.log(`Port: ${process.env.DB_PORT}`);
console.log(`User: ${process.env.DB_USER}`);
console.log(`Database: ${process.env.DB_NAME}`);

// 创建连接
async function testConnection() {
    try {
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            port: process.env.DB_PORT,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME,
            // 设置较短的连接超时时间
            connectTimeout: 10000,
        });

        console.log('数据库连接成功!');
        await connection.end();
    } catch (error) {
        console.error('数据库连接失败:', error);

        // 提供更详细的错误诊断信息
        if (error.code === 'ETIMEDOUT') {
            console.error('\n可能的原因:');
            console.error('1. 阿里云RDS白名单没有包含你的IP地址');
            console.error('2. 数据库端口未开放公网访问');
            console.error('3. 网络连接问题');
            console.error('\n解决方案:');
            console.error('1. 登录阿里云控制台，将你的公网IP添加到RDS白名单中');
            console.error('2. 确认RDS实例已开启外网访问，并使用正确的外网连接地址');
        } else if (error.code === 'ER_ACCESS_DENIED_ERROR') {
            console.error('\n可能的原因:');
            console.error('1. 用户名或密码错误');
            console.error('2. 该用户没有访问指定数据库的权限');
        } else if (error.code === 'ER_BAD_DB_ERROR') {
            console.error('\n可能的原因:');
            console.error(`1. 数据库 '${process.env.DB_NAME}' 不存在`);
            console.error('2. 当前用户没有访问此数据库的权限');
        }
    }
}

testConnection();

// 修改测试账号的跳转逻辑
if (username === 'test_student' && password === '123456') {
    console.log('使用学生测试账号登录');
    const mockUser = {
        id: 'test-s-1001',
        name: '测试学生账号',
        role: 'student',
        contactType: 'username',
        contact: 'test_student'
    };
    localStorage.setItem('auth_token', 'mock-jwt-token-student');
    localStorage.setItem('currentUser', JSON.stringify(mockUser));

    // 跳转到学生端应用
    window.location.href = 'http://localhost:8080';
    return;
}

if (username === 'test_teacher' && password === '123456') {
    console.log('使用教师测试账号登录');
    const mockUser = {
        id: 'test-t-2001',
        name: '测试教师账号',
        role: 'teacher',
        contactType: 'username',
        contact: 'test_teacher'
    };
    localStorage.setItem('auth_token', 'mock-jwt-token-teacher');
    localStorage.setItem('currentUser', JSON.stringify(mockUser));

    // 跳转到教师端应用
    window.location.href = 'http://localhost:8081';
    return;
}

// 添加学生按钮点击事件
studentButton.addEventListener("click", () => {
    // 检查是否已登录
    const user = JSON.parse(localStorage.getItem('currentUser') || '{}');
    if (user && user.id && user.role === 'student') {
        window.location.href = "http://localhost:8080";
    } else {
        window.location.href = "login.html?role=student";
    }
});

// 添加老师按钮点击事件
teacherButton.addEventListener("click", () => {
    // 检查是否已登录
    const user = JSON.parse(localStorage.getItem('currentUser') || '{}');
    if (user && user.id && user.role === 'teacher') {
        window.location.href = "http://localhost:8081";
    } else {
        window.location.href = "login.html?role=teacher";
    }
}); 