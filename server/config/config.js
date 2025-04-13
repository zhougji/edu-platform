// server/config/config.js

module.exports = {
    // JWT 秘钥，用于签署和验证 JWT
    jwtSecret: process.env.JWT_SECRET || 'your_jwt_secret',

    // 数据库连接字符串
    dbUri: process.env.DB_URI || 'mongodb://localhost:27017/your_database',

    // 服务器端口
    port: process.env.PORT || 5000,

    // 其他配置项
    // 例如：第三方 API 密钥、邮件服务配置等
    // apiKey: process.env.API_KEY || 'your_api_key',
    // mailService: {
    //     host: process.env.MAIL_HOST || 'smtp.example.com',
    //     port: process.env.MAIL_PORT || 587,
    //     user: process.env.MAIL_USER || 'user@example.com',
    //     pass: process.env.MAIL_PASS || 'your_password'
    // }
};