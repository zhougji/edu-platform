// server/controllers/resourceController.js
const fs = require('fs');
const path = require('path');

// 资源文件路径
const RESOURCES_FILE_PATH = path.join(__dirname, '../data/resources.json');

// 读取资源数据
const readResources = () => {
    try {
        // 确保文件存在
        if (!fs.existsSync(RESOURCES_FILE_PATH)) {
            console.log('Resource file not found, returning empty array.');
            return [];
        }
        const data = fs.readFileSync(RESOURCES_FILE_PATH, 'utf8');
        return data ? JSON.parse(data) : [];
    } catch (error) {
        console.error('Error reading resources file:', error);
        return []; // 错误时返回空数组
    }
};

// @desc    获取所有资源列表
// @route   GET /api/resources
// @access  Public / Private (取决于你的设计)
exports.getResources = async (req, res, next) => {
    console.log('[GET /api/resources] 请求资源列表');
    const resources = readResources();
    res.status(200).json({
        success: true,
        count: resources.length,
        data: resources
    });
};

// @desc    获取单个资源详情
// @route   GET /api/resources/:id
// @access  Public / Private
exports.getResourceById = async (req, res, next) => {
    const resourceId = req.params.id;
    console.log(`[GET /api/resources/:id] 请求资源详情: ${resourceId}`);
    const resources = readResources();
    const resource = resources.find(r => r && r.id === resourceId);

    if (resource) {
        res.status(200).json({ success: true, data: resource });
    } else {
        res.status(404).json({ success: false, message: '资源未找到' });
    }
};

// 其他 CRUD 操作 (创建, 更新, 删除) 可以后续添加
// exports.createResource = async (req, res, next) => { ... };
// exports.updateResource = async (req, res, next) => { ... };
// exports.deleteResource = async (req, res, next) => { ... }; 