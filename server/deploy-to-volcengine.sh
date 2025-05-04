#!/bin/bash

# 启明隅教育平台 - 火山引擎部署脚本
# 此脚本用于将整个项目部署到火山引擎服务器上

set -e  # 遇到错误立即退出
echo "===== 启明隅教育平台部署脚本 ====="

# 1. 构建后端应用
echo "1. 构建Spring Boot应用..."
mvn clean package -DskipTests

# 2. 修改生产环境配置
echo "2. 创建生产环境配置文件..."
cat > src/main/resources/application-prod.properties << EOL
# 生产环境配置
spring.application.name=edu-platform
server.port=8085

# 阿里云RDS数据库连接
spring.datasource.url=jdbc:mysql://rm-bp1o60gt7ob6i8jvkto.mysql.rds.aliyuncs.com:3306/qimingyu?useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=Asia/Shanghai&connectTimeout=60000&socketTimeout=60000&useUnicode=true&characterEncoding=UTF-8&failOverReadOnly=false&autoReconnect=true
spring.datasource.username=zgj
spring.datasource.password=Zgj20050112_
spring.datasource.driver-class-name=com.mysql.cj.jdbc.Driver

# JPA properties - 使用none避免自动修改表结构
spring.jpa.hibernate.ddl-auto=none
spring.jpa.show-sql=false
spring.jpa.properties.hibernate.format_sql=false
spring.jpa.properties.hibernate.dialect=org.hibernate.dialect.MySQL8Dialect
spring.jpa.open-in-view=false

# 优化连接池参数
spring.datasource.hikari.connection-timeout=60000
spring.datasource.hikari.maximum-pool-size=10
spring.datasource.hikari.minimum-idle=3
spring.datasource.hikari.idle-timeout=300000
spring.datasource.hikari.max-lifetime=1800000
spring.datasource.hikari.validation-timeout=5000
spring.datasource.hikari.connection-test-query=SELECT 1

# JWT Configuration
jwt.secret=qimingyuEducationPlatformSecretKey2023WithStrongSecurityAndEnhancedProtectionForAllUsersAndTeachersOnThisPlatformToEnsureBetterExperienceAndSafetyInAllTransactionsAndOperations12345
jwt.expirationMs=86400000

# 文件上传配置
spring.servlet.multipart.enabled=true
spring.servlet.multipart.file-size-threshold=2KB
spring.servlet.multipart.max-file-size=500MB
spring.servlet.multipart.max-request-size=515MB
file.upload-dir=./uploads

# 静态资源访问配置
spring.web.resources.static-locations=classpath:/META-INF/resources/,classpath:/resources/,classpath:/static/,classpath:/public/,file:./uploads/
spring.mvc.static-path-pattern=/**

# DeepSeek AI Configuration
deepseek.api.url=https://api.deepseek.com/v1
deepseek.api.key=sk-3055bc4ab01c4cd3b1620daa75a85ac0

# 日志配置 - 生产环境降低日志级别
logging.level.org.hibernate.SQL=INFO
logging.level.org.hibernate.type.descriptor.sql.BasicBinder=INFO
logging.level.org.springframework.security=WARN
logging.level.com.qimingyu=INFO
logging.level.org.springframework.web=WARN
logging.level.org.springframework.web.reactive=WARN
logging.level.reactor.netty=WARN
logging.level.org.springframework.web.socket=WARN

# CORS配置 - 生产环境
cors.allowed-origins=http://qimingyu.xyz,https://qimingyu.xyz

# WebSocket配置
spring.websocket.enabled=true
EOL

# 3. 修改前端API配置
echo "3. 修改前端API配置..."
cd ../
mkdir -p dist

# 复制所有静态文件到dist目录
echo "4. 复制静态文件到dist目录..."
cp -r public/* dist/

# 5. 创建系统服务配置
echo "5. 创建系统服务配置..."
cat > qimingyu-service.service << EOL
[Unit]
Description=Qimingyu Education Platform
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/opt/qimingyu
ExecStart=/usr/bin/java -Xms512m -Xmx1024m -jar edu-platform.jar --spring.profiles.active=prod
Restart=always
RestartSec=10
StandardOutput=syslog
StandardError=syslog
SyslogIdentifier=qimingyu

[Install]
WantedBy=multi-user.target
EOL

# 6. 创建Nginx配置
echo "6. 创建Nginx配置..."
cat > nginx-qimingyu.conf << EOL
server {
    listen 80;
    server_name qimingyu.xyz;
    
    # 将HTTP请求重定向到HTTPS
    location / {
        return 301 https://\$host\$request_uri;
    }
}

server {
    listen 443 ssl;
    server_name qimingyu.xyz;
    
    # SSL证书配置
    ssl_certificate /etc/letsencrypt/live/qimingyu.xyz/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/qimingyu.xyz/privkey.pem;
    ssl_session_timeout 5m;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_prefer_server_ciphers on;
    
    # 主页和静态文件
    location / {
        root /opt/qimingyu/public;
        index index.html;
        try_files \$uri \$uri/ /index.html;
    }
    
    # API请求转发到Spring Boot应用
    location /api/ {
        proxy_pass http://localhost:8085/api/;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
    
    # WebSocket支持
    location /ws {
        proxy_pass http://localhost:8085/ws;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
    }
    
    # 上传文件访问
    location /uploads/ {
        alias /opt/qimingyu/uploads/;
        expires 7d;
    }
    
    # 错误页面
    error_page 404 /index.html;
    location = /404.html {
        root /opt/qimingyu/public;
    }
}
EOL

# 7. 创建部署说明文档
echo "7. 创建部署说明文档..."
cat > DEPLOYMENT.md << EOL
# 启明隅教育平台部署说明

## 系统要求
- JDK 11+
- MySQL 8+
- Nginx
- 2GB+ 内存

## 部署步骤

### 1. 准备服务器
1. 在火山引擎上创建2核2G的ECS实例
2. 安装必要软件: 
   \`\`\`
   apt update && apt install -y openjdk-11-jdk nginx certbot python3-certbot-nginx
   \`\`\`

### 2. 配置SSL证书
1. 配置域名解析，将qimingyu.xyz指向服务器IP
2. 获取SSL证书:
   \`\`\`
   certbot --nginx -d qimingyu.xyz
   \`\`\`

### 3. 部署应用程序
1. 创建应用目录:
   \`\`\`
   mkdir -p /opt/qimingyu/uploads
   \`\`\`

2. 复制文件:
   \`\`\`
   cp -r dist/* /opt/qimingyu/public/
   cp server/target/edu-platform-0.0.1-SNAPSHOT.jar /opt/qimingyu/edu-platform.jar
   cp qimingyu-service.service /etc/systemd/system/
   cp nginx-qimingyu.conf /etc/nginx/sites-available/
   \`\`\`

3. 启用Nginx配置:
   \`\`\`
   ln -s /etc/nginx/sites-available/nginx-qimingyu.conf /etc/nginx/sites-enabled/
   nginx -t
   systemctl restart nginx
   \`\`\`

4. 启动应用服务:
   \`\`\`
   systemctl daemon-reload
   systemctl enable qimingyu-service
   systemctl start qimingyu-service
   \`\`\`

### 4. 监控与维护
- 检查服务状态: \`systemctl status qimingyu-service\`
- 查看日志: \`journalctl -u qimingyu-service\`
- 备份数据库和上传文件
EOL

# 8. 生成部署包
echo "8. 创建最终部署包..."
cd server
mvn clean package -DskipTests -Pprod

echo "9. 打包完成，部署文件准备就绪"
echo "请参考DEPLOYMENT.md进行部署操作" 