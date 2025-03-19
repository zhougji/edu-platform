const Service = require('node-windows').Service;
const path = require('path');

// 创建服务对象
const svc = new Service({
    name: 'EduPlatform-Backend',
    description: '教育平台后端服务，提供学生和教师 API',
    script: path.join(__dirname, 'app.js'),
    nodeOptions: [
        '--harmony',
        '--max_old_space_size=4096'
    ]
});

svc.on('install', () => {
    svc.start();
    console.log('服务安装并启动成功');
});

svc.install();
