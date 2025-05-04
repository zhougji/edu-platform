# 启明隅教育平台部署指南

本文档提供了将启明隅教育平台部署到服务器的详细步骤。

## 前提条件

- 目标服务器: 14.103.240.228
- 域名: qimingyu.xyz
- 应用名称: edu-platform
- 部署路径: /var/www/edu-platform

## 部署步骤

### 1. 准备阶段

已完成的工作:
- JAR 文件已成功构建 (edu-platform-0.0.1-SNAPSHOT.jar)
- 前端文件已正确组织到 dist 目录

### 2. 服务器端部署

在有 SSH 和 SCP 访问权限的系统上执行以下命令:

```bash
# 创建服务器目录结构
ssh root@14.103.240.228 'mkdir -p /var/www/edu-platform/public /var/www/edu-platform/student-app /var/www/edu-platform/teacher-app'

# 上传前端文件
scp -r dist/* root@14.103.240.228:/var/www/edu-platform/

# 上传后端 JAR 文件
scp server/target/edu-platform-0.0.1-SNAPSHOT.jar root@14.103.240.228:/var/www/edu-platform/

# 上传 systemd 服务文件
scp edu-platform.service root@14.103.240.228:/etc/systemd/system/

# 配置并启动服务
ssh root@14.103.240.228 'systemctl daemon-reload && systemctl enable edu-platform.service && systemctl start edu-platform.service'

# 上传 Nginx 配置
scp nginx.conf root@14.103.240.228:/etc/nginx/sites-available/qimingyu.xyz

# 配置 Nginx 并重新加载
ssh root@14.103.240.228 'ln -sf /etc/nginx/sites-available/qimingyu.xyz /etc/nginx/sites-enabled/ && nginx -t && systemctl reload nginx'
```

### 3. 验证部署

部署完成后，通过以下 URL 访问应用:
- 主页: http://qimingyu.xyz
- 学生端: http://qimingyu.xyz/student-app
- 教师端: http://qimingyu.xyz/teacher-app

### 4. 注意事项

- 确保服务器防火墙允许 80 和 443 端口访问
- 后端 API 将在 http://qimingyu.xyz/api 路径下提供服务
- 所有前端资源 (CSS、JS、图像等) 将保持原样，确保与设计一致

### 5. 故障排查

如果部署后出现问题，可检查:
- 服务状态: `systemctl status edu-platform.service`
- 应用日志: `journalctl -u edu-platform.service`
- Nginx 日志: `/var/log/nginx/error.log`
- 确保文件权限正确: `chown -R www-data:www-data /var/www/edu-platform` 