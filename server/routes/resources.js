const express = require('express');
const {
    getResources,
    getResourceById,
    // createResource, // 未来可以添加
    // updateResource,
    // deleteResource
} = require('../controllers/resourceController');
const { protect } = require('../middleware/auth'); // 引入保护中间件

const router = express.Router();

// 定义路由
// 获取资源列表 (可以公开，也可以要求登录)
// router.get('/', protect, getResources); // 如果需要登录
router.get('/', getResources); // 假设公开

// 获取单个资源详情 (可以公开，也可以要求登录)
// router.get('/:id', protect, getResourceById); // 如果需要登录
router.get('/:id', getResourceById); // 假设公开

// --- 以下路由通常需要登录和权限控制 ---
// router.post('/', protect, /* authorize(...) */, createResource);
// router.put('/:id', protect, /* authorize(...) */, updateResource);
// router.delete('/:id', protect, /* authorize(...) */, deleteResource);

module.exports = router; 