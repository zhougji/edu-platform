# 启明隅教育平台 - 快速部署清单

## 本地准备

1. 构建后端应用：
   ```
   cd server
   mvn clean package -DskipTests
   ```

2. 准备前端文件：
   ```
   cd ..
   mkdir -p dist
   cp -r public/* dist/
   ```

## 服务器配置 (Ubuntu 20.04)

1. 安装必要软件：
   ```
   apt update
   apt install -y openjdk-11-jdk nginx certbot python3-certbot-nginx
   ```

2. 创建应用目录：
   ```
   mkdir -p /opt/qimingyu/uploads /opt/qimingyu/public
   ```

3. 获取SSL证书：
   ```
   certbot --nginx -d qimingyu.xyz
   ```

4. 配置Nginx：
   - 复制 `nginx-qimingyu.conf` 到 `/etc/nginx/sites-available/`
   - 创建软链接并重启Nginx：
     ```
     ln -s /etc/nginx/sites-available/nginx-qimingyu.conf /etc/nginx/sites-enabled/
     nginx -t && systemctl restart nginx
     ```

5. 配置系统服务：
   - 复制 `qimingyu-service.service` 到 `/etc/systemd/system/`
   - 重载systemd配置：
     ```
     systemctl daemon-reload
     ```

## 部署应用

1. 上传文件到服务器：
   ```
   scp -r dist/* root@SERVER_IP:/opt/qimingyu/public/
   scp server/target/edu-platform-0.0.1-SNAPSHOT.jar root@SERVER_IP:/opt/qimingyu/edu-platform.jar
   ```

2. 启动应用服务：
   ```
   systemctl enable qimingyu-service
   systemctl start qimingyu-service
   ```

3. 验证部署：
   - 访问 https://qimingyu.xyz
   - 访问 https://qimingyu.xyz/status.html

## 常用命令

- 查看服务状态：`systemctl status qimingyu-service`
- 查看应用日志：`journalctl -u qimingyu-service`
- 重启应用：`systemctl restart qimingyu-service`
- 重启Nginx：`systemctl restart nginx`

## 注意事项

1. 确保防火墙开放80和443端口
2. 确保阿里云RDS数据库可以从火山引擎服务器访问
3. 建议定期备份上传的文件：`tar -czf /backup/uploads-$(date +%Y%m%d).tar.gz /opt/qimingyu/uploads` 