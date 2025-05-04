# 启明隅教育平台部署指南

## 项目概述

启明隅教育平台是一个面向学生和教师的在线教育系统，提供视频课程、练习题和AI辅助等功能。本文档详细介绍如何将该平台部署到火山引擎云服务器上。

## 系统架构

- **前端**: 静态HTML、CSS、JavaScript
- **后端**: Spring Boot Java应用
- **数据库**: MySQL (阿里云RDS)
- **Web服务器**: Nginx
- **应用服务器**: Embedded Tomcat
- **文件存储**: 服务器本地存储

## 部署前准备

### 1. 硬件要求

- 火山引擎云服务器
  - CPU: 2核
  - 内存: 2GB或以上
  - 磁盘: 40GB或以上
  - 操作系统: Ubuntu 20.04或以上

### 2. 软件依赖

- JDK 11+
- MySQL 8+ (已有阿里云RDS)
- Nginx
- Certbot (用于SSL证书管理)

## 部署步骤

### 1. 准备服务器环境

```bash
# 连接到火山引擎服务器
ssh root@YOUR_SERVER_IP

# 更新系统包
apt update
apt upgrade -y

# 安装JDK 11
apt install -y openjdk-11-jdk

# 安装Nginx
apt install -y nginx

# 安装Certbot (用于SSL证书)
apt install -y certbot python3-certbot-nginx

# 创建应用目录
mkdir -p /opt/qimingyu/uploads
mkdir -p /opt/qimingyu/public
```

### 2. 获取SSL证书

确保已经将域名 `qimingyu.xyz` 解析到服务器IP地址，然后执行:

```bash
certbot --nginx -d qimingyu.xyz
```

按照提示完成SSL证书配置。

### 3. 配置Nginx

创建Nginx配置文件:

```bash
cat > /etc/nginx/sites-available/qimingyu.conf << 'EOF'
server {
    listen 80;
    server_name qimingyu.xyz;
    
    # 将HTTP请求重定向到HTTPS
    location / {
        return 301 https://$host$request_uri;
    }
}

server {
    listen 443 ssl;
    server_name qimingyu.xyz;
    
    # SSL证书配置 - Certbot会自动配置这部分
    
    # 主页和静态文件
    location / {
        root /opt/qimingyu/public;
        index index.html;
        try_files $uri $uri/ /index.html;
    }
    
    # API请求转发到Spring Boot应用
    location /api/ {
        proxy_pass http://localhost:8085/api/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    # WebSocket支持
    location /ws {
        proxy_pass http://localhost:8085/ws;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
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
EOF

# 启用配置
ln -s /etc/nginx/sites-available/qimingyu.conf /etc/nginx/sites-enabled/
nginx -t
systemctl restart nginx
```

### 4. 配置Spring Boot应用服务

创建系统服务文件:

```bash
cat > /etc/systemd/system/qimingyu.service << 'EOF'
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
EOF
```

### 5. 部署应用文件

在本地构建项目:

```bash
# 在本地开发环境执行
# 构建后端应用
cd server
mvn clean package -DskipTests -Pprod

# 准备前端文件
cd ..
mkdir -p dist
cp -r public/* dist/
```

将构建好的文件传输到服务器:

```bash
# 从本地传输文件到服务器
scp -r dist/* root@YOUR_SERVER_IP:/opt/qimingyu/public/
scp server/target/edu-platform-0.0.1-SNAPSHOT.jar root@YOUR_SERVER_IP:/opt/qimingyu/edu-platform.jar
```

### 6. 启动应用

在服务器上执行:

```bash
# 重新加载systemd配置
systemctl daemon-reload

# 启用并启动服务
systemctl enable qimingyu.service
systemctl start qimingyu.service
```

### 7. 验证部署

- 访问 `https://qimingyu.xyz` 检查前端是否正常加载
- 访问 `https://qimingyu.xyz/status.html` 查看系统状态
- 检查后端日志: `journalctl -u qimingyu.service`

## 维护与故障排除

### 日常维护

1. **备份数据**: 定期备份上传的文件和数据库
   ```bash
   # 备份上传文件
   tar -czf /backup/uploads-$(date +%Y%m%d).tar.gz /opt/qimingyu/uploads
   ```

2. **检查日志**: 定期检查应用日志
   ```bash
   journalctl -u qimingyu.service
   ```

3. **更新应用**: 当有新版本时
   ```bash
   # 停止服务
   systemctl stop qimingyu.service
   
   # 复制新jar文件
   cp new-edu-platform.jar /opt/qimingyu/edu-platform.jar
   
   # 启动服务
   systemctl start qimingyu.service
   ```

### 故障排除

1. **应用无法启动**:
   - 检查日志: `journalctl -u qimingyu.service`
   - 验证JDK版本: `java -version`
   - 手动测试启动: `cd /opt/qimingyu && java -jar edu-platform.jar`

2. **网站无法访问**:
   - 检查Nginx状态: `systemctl status nginx`
   - 检查Nginx配置: `nginx -t`
   - 检查防火墙: `ufw status`

3. **API请求失败**:
   - 确认应用正在运行: `systemctl status qimingyu.service`
   - 测试API健康检查: `curl http://localhost:8085/api/status/health`
   - 检查CORS配置是否正确

## 性能优化

对于2核2G服务器，建议以下优化措施:

1. **JVM调整**:
   - 适当调整内存分配: `-Xms512m -Xmx1024m`
   - 添加垃圾回收优化参数: `-XX:+UseG1GC -XX:MaxGCPauseMillis=200`

2. **数据库连接池**:
   - 最大连接数设为10: `spring.datasource.hikari.maximum-pool-size=10`
   - 最小空闲连接设为3: `spring.datasource.hikari.minimum-idle=3`

3. **Nginx缓存**:
   - 为静态资源添加缓存头
   - 启用gzip压缩

4. **日志级别**:
   - 生产环境降低日志级别，减少I/O操作

## 联系与支持

如有部署问题，请联系系统管理员或开发团队。 