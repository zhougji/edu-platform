#!/bin/bash

# 设置变量
SERVER_IP="14.103.240.228"
DOMAIN="qimingyu.xyz"
APP_NAME="edu-platform"
DEPLOY_PATH="/var/www/$APP_NAME"
JAR_FILE="server/target/$APP_NAME-0.0.1-SNAPSHOT.jar"

# 编译后端
echo "编译后端应用..."
cd server
./mvnw clean package -DskipTests
cd ..

# 检查编译是否成功
if [ ! -f "$JAR_FILE" ]; then
    echo "构建失败，JAR文件不存在: $JAR_FILE"
    exit 1
fi

# 创建前端目录结构确保图片路径正确
echo "组织前端文件..."
mkdir -p dist/public
mkdir -p dist/student-app
mkdir -p dist/teacher-app

# 复制前端文件
cp -r server/src/main/resources/static/* dist/

# 创建远程服务器上的目录结构
echo "准备远程服务器环境..."
ssh root@$SERVER_IP "mkdir -p $DEPLOY_PATH/public"
ssh root@$SERVER_IP "mkdir -p $DEPLOY_PATH/student-app"
ssh root@$SERVER_IP "mkdir -p $DEPLOY_PATH/teacher-app"

# 部署前端文件
echo "部署前端文件..."
scp -r dist/* root@$SERVER_IP:$DEPLOY_PATH/

# 部署后端JAR文件
echo "部署后端应用..."
scp $JAR_FILE root@$SERVER_IP:$DEPLOY_PATH/

# 创建systemd服务文件
echo "配置系统服务..."
cat > edu-platform.service << EOF
[Unit]
Description=Education Platform Service
After=network.target

[Service]
User=root
WorkingDirectory=$DEPLOY_PATH
ExecStart=/usr/bin/java -jar $DEPLOY_PATH/$APP_NAME-0.0.1-SNAPSHOT.jar
SuccessExitStatus=143
TimeoutStopSec=10
Restart=on-failure
RestartSec=5

[Install]
WantedBy=multi-user.target
EOF

# 上传并启用服务
scp edu-platform.service root@$SERVER_IP:/etc/systemd/system/
ssh root@$SERVER_IP "systemctl daemon-reload"
ssh root@$SERVER_IP "systemctl enable edu-platform.service"
ssh root@$SERVER_IP "systemctl start edu-platform.service"

# 配置Nginx
echo "配置Nginx..."
cat > nginx.conf << EOF
server {
    listen 80;
    server_name $DOMAIN;

    location /api {
        proxy_pass http://localhost:5000;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }

    location /student-app {
        root $DEPLOY_PATH;
        try_files \$uri \$uri/ /student-app/index.html;
    }

    location /teacher-app {
        root $DEPLOY_PATH;
        try_files \$uri \$uri/ /teacher-app/index.html;
    }

    location / {
        root $DEPLOY_PATH/public;
        try_files \$uri \$uri/ /index.html;
    }
}
EOF

# 上传Nginx配置
scp nginx.conf root@$SERVER_IP:/etc/nginx/sites-available/$DOMAIN
ssh root@$SERVER_IP "ln -sf /etc/nginx/sites-available/$DOMAIN /etc/nginx/sites-enabled/"
ssh root@$SERVER_IP "nginx -t && systemctl reload nginx"

echo "部署完成! 应用已经在 http://$DOMAIN 上线。" 