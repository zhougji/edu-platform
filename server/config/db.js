const mysql = require('mysql2/promise');
const dotenv = require('dotenv');

// 加载环境变量
dotenv.config();

// 创建连接池
const pool = mysql.createPool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    connectTimeout: 60000,
    // 增加自动重连设置
    enableKeepAlive: true,
    keepAliveInitialDelay: 30000, // 30秒
    // 添加错误处理
    namedPlaceholders: true,
    // 如果RDS未开启SSL，注释掉或移除下面的ssl配置块
    /*
    ssl: {
        rejectUnauthorized: false, 
        minVersion: 'TLSv1.2'      
    }
    */
});

// 添加连接池错误处理
pool.on('error', (err) => {
    console.error('数据库连接池错误:', err);
    if (err.code === 'PROTOCOL_CONNECTION_LOST') {
        console.log('尝试重新连接数据库...');
        // 在生产环境中，可能需要更复杂的重连逻辑
    }
});

// 测试数据库连接
const testConnection = async () => {
    try {
        const connection = await pool.getConnection();
        console.log('数据库连接成功!');
        connection.release();
    } catch (error) {
        console.error('数据库连接失败:', error);
        // 不再立即退出，而是继续尝试
        console.log('应用将继续运行，并在数据库可用时自动连接');
    }
};

// 初始化数据库表
const initDb = async () => {
    try {
        // 用户表
        await pool.execute(`
            CREATE TABLE IF NOT EXISTS users (
                id VARCHAR(36) PRIMARY KEY,
                name VARCHAR(50) NOT NULL,
                email VARCHAR(100) UNIQUE,
                phone VARCHAR(20) UNIQUE,
                password VARCHAR(100) NOT NULL,
                role ENUM('student', 'teacher', 'admin') NOT NULL DEFAULT 'student',
                avatar VARCHAR(255),
                createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                lastActive TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                isEmailVerified BOOLEAN DEFAULT false
            )
        `);

        // 教师扩展信息表
        await pool.execute(`
            CREATE TABLE IF NOT EXISTS teacher_profiles (
                userId VARCHAR(36) PRIMARY KEY,
                realName VARCHAR(50),
                subject VARCHAR(100),
                description TEXT,
                FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
            )
        `);

        // 用户令牌表
        await pool.execute(`
            CREATE TABLE IF NOT EXISTS user_tokens (
                id INT AUTO_INCREMENT PRIMARY KEY,
                userId VARCHAR(36) NOT NULL,
                token VARCHAR(500) NOT NULL,
                createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
                INDEX (token(191)),
                INDEX (userId)
            )
        `);

        console.log('数据库表初始化完成');
        return true;
    } catch (error) {
        console.error('数据库表初始化失败:', error);
        // 数据库初始化失败不再退出应用
        return false;
    }
};

module.exports = {
    pool,
    testConnection,
    initDb
}; 