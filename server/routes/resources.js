const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { check, validationResult } = require('express-validator');
const Resource = require('../models/Resource');
const { protect, authorize, verifiedOnly } = require('../middleware/auth');

// 创建上传目录
const uploadDir = process.env.UPLOAD_DIR || 'uploads';
const resourceDir = path.join(uploadDir, 'resources');

if (!fs.existsSync(resourceDir)) {
    fs.mkdirSync(resourceDir, { recursive: true });
}

// 配置Multer存储
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, resourceDir);
    },
    filename: (req, file, cb) => {
        // 创建唯一文件名: 时间戳 + 随机数 + 原始扩展名
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, uniqueSuffix + ext);
    }
});

// 文件类型过滤器
const fileFilter = (req, file, cb) => {
    // 允许的文件类型
    const allowedTypes = {
        video: ['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime'],
        document: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
        image: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
        audio: ['audio/mpeg', 'audio/ogg', 'audio/wav']
    };

    const fileType = file.fieldname === 'thumbnail' ? 'image' :
        req.body.type || 'video';

    if (fileType === 'image' && allowedTypes.image.includes(file.mimetype)) {
        cb(null, true);
    } else if (fileType === 'video' && allowedTypes.video.includes(file.mimetype)) {
        cb(null, true);
    } else if (fileType === 'document' && allowedTypes.document.includes(file.mimetype)) {
        cb(null, true);
    } else if (fileType === 'audio' && allowedTypes.audio.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error(`不支持的文件类型: ${file.mimetype}`), false);
    }
};

// 设置上传
const upload = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: 500 * 1024 * 1024 // 500MB最大限制
    }
});

/**
 * @route   POST /api/resources
 * @desc    上传新资源
 * @access  Private (只有教师和管理员可以上传)
 */
router.post(
    '/',
    [
        protect,
        verifiedOnly,
        authorize('teacher', 'admin'),
        upload.fields([
            { name: 'file', maxCount: 1 },
            { name: 'thumbnail', maxCount: 1 }
        ]),
        [
            check('title', '标题是必需的').not().isEmpty(),
            check('description', '描述是必需的').not().isEmpty(),
            check('subject', '请选择学科').not().isEmpty(),
            check('grade', '请选择年级').not().isEmpty()
        ]
    ],
    async (req, res) => {
        try {
            // 验证输入
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                // 如果上传了文件但表单验证失败，删除已上传的文件
                if (req.files) {
                    Object.values(req.files).forEach(files => {
                        files.forEach(file => {
                            fs.unlinkSync(file.path);
                        });
                    });
                }
                return res.status(400).json({
                    success: false,
                    errors: errors.array()
                });
            }

            const {
                title,
                description,
                type = 'video',
                subject,
                grade,
                tags
            } = req.body;

            // 创建资源对象
            const resourceData = {
                title,
                description,
                type,
                subject,
                grade,
                createdBy: req.user._id,
                tags: tags ? tags.split(',').map(tag => tag.trim()) : []
            };

            // 处理上传的文件
            if (req.files.file && req.files.file[0]) {
                const file = req.files.file[0];
                resourceData.videoFile = file.path;
                resourceData.fileSize = file.size;
            }

            // 处理缩略图
            if (req.files.thumbnail && req.files.thumbnail[0]) {
                resourceData.thumbnailUrl = req.files.thumbnail[0].path;
            }

            // 创建资源
            const resource = await Resource.create(resourceData);

            res.status(201).json({
                success: true,
                resource,
                message: '资源上传成功'
            });
        } catch (error) {
            // 处理错误，删除已上传的文件
            if (req.files) {
                Object.values(req.files).forEach(files => {
                    files.forEach(file => {
                        if (fs.existsSync(file.path)) {
                            fs.unlinkSync(file.path);
                        }
                    });
                });
            }

            console.error('资源上传错误:', error);
            res.status(500).json({
                success: false,
                message: '服务器错误',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    }
);

/**
 * @route   GET /api/resources
 * @desc    获取资源列表
 * @access  Public
 */
router.get('/', async (req, res) => {
    try {
        const {
            page = 1,
            limit = 10,
            subject,
            grade,
            type,
            search,
            sort = '-createdAt'
        } = req.query;

        // 构建查询条件
        const query = {};

        if (subject) query.subject = subject;
        if (grade) query.grade = grade;
        if (type) query.type = type;

        // 搜索功能
        if (search) {
            query.$or = [
                { title: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } },
                { tags: { $regex: search, $options: 'i' } }
            ];
        }

        // 计算分页
        const total = await Resource.countDocuments(query);
        const resources = await Resource.find(query)
            .populate('createdBy', 'name avatar')
            .sort(sort)
            .skip((parseInt(page) - 1) * parseInt(limit))
            .limit(parseInt(limit));

        // 返回结果
        res.json({
            success: true,
            count: resources.length,
            total,
            pages: Math.ceil(total / parseInt(limit)),
            page: parseInt(page),
            resources
        });
    } catch (error) {
        console.error('获取资源列表错误:', error);
        res.status(500).json({
            success: false,
            message: '服务器错误',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

/**
 * @route   GET /api/resources/:id
 * @desc    获取单个资源详情
 * @access  Public
 */
router.get('/:id', async (req, res) => {
    try {
        const resource = await Resource.findById(req.params.id)
            .populate('createdBy', 'name avatar profile')
            .populate('comments.user', 'name avatar');

        if (!resource) {
            return res.status(404).json({
                success: false,
                message: '资源未找到'
            });
        }

        // 增加浏览次数
        resource.views += 1;
        await resource.save({ validateBeforeSave: false });

        res.json({
            success: true,
            resource
        });
    } catch (error) {
        console.error('获取资源详情错误:', error);
        res.status(500).json({
            success: false,
            message: '服务器错误',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

/**
 * @route   PUT /api/resources/:id
 * @desc    更新资源
 * @access  Private
 */
router.put('/:id', [protect, verifiedOnly], async (req, res) => {
    try {
        let resource = await Resource.findById(req.params.id);

        if (!resource) {
            return res.status(404).json({
                success: false,
                message: '资源未找到'
            });
        }

        // 检查权限 - 只有创建者或管理员可以更新
        if (resource.createdBy.toString() !== req.user._id.toString() &&
            req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: '权限不足，您不是此资源的创建者'
            });
        }

        // 更新字段
        const {
            title,
            description,
            subject,
            grade,
            tags
        } = req.body;

        const updateData = {};

        if (title) updateData.title = title;
        if (description) updateData.description = description;
        if (subject) updateData.subject = subject;
        if (grade) updateData.grade = grade;
        if (tags) updateData.tags = tags.split(',').map(tag => tag.trim());

        // 更新资源
        resource = await Resource.findByIdAndUpdate(
            req.params.id,
            updateData,
            { new: true, runValidators: true }
        ).populate('createdBy', 'name avatar');

        res.json({
            success: true,
            resource,
            message: '资源更新成功'
        });
    } catch (error) {
        console.error('更新资源错误:', error);
        res.status(500).json({
            success: false,
            message: '服务器错误',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

/**
 * @route   DELETE /api/resources/:id
 * @desc    删除资源
 * @access  Private
 */
router.delete('/:id', [protect, verifiedOnly], async (req, res) => {
    try {
        const resource = await Resource.findById(req.params.id);

        if (!resource) {
            return res.status(404).json({
                success: false,
                message: '资源未找到'
            });
        }

        // 检查权限 - 只有创建者或管理员可以删除
        if (resource.createdBy.toString() !== req.user._id.toString() &&
            req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: '权限不足，您不是此资源的创建者'
            });
        }

        // 删除物理文件
        if (resource.videoFile && fs.existsSync(resource.videoFile)) {
            fs.unlinkSync(resource.videoFile);
        }

        if (resource.thumbnailUrl && fs.existsSync(resource.thumbnailUrl)) {
            fs.unlinkSync(resource.thumbnailUrl);
        }

        // 从数据库删除
        await resource.deleteOne();

        res.json({
            success: true,
            message: '资源删除成功'
        });
    } catch (error) {
        console.error('删除资源错误:', error);
        res.status(500).json({
            success: false,
            message: '服务器错误',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

/**
 * @route   POST /api/resources/:id/comments
 * @desc    添加评论
 * @access  Private
 */
router.post(
    '/:id/comments',
    [
        protect,
        verifiedOnly,
        check('text', '评论内容是必需的').not().isEmpty()
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                errors: errors.array()
            });
        }

        try {
            const resource = await Resource.findById(req.params.id);

            if (!resource) {
                return res.status(404).json({
                    success: false,
                    message: '资源未找到'
                });
            }

            // 创建新评论
            const newComment = {
                user: req.user._id,
                text: req.body.text
            };

            // 添加到评论数组
            resource.comments.unshift(newComment);
            await resource.save();

            // 返回填充了用户信息的评论
            const populatedResource = await Resource.findById(req.params.id)
                .populate('comments.user', 'name avatar');

            res.json({
                success: true,
                comments: populatedResource.comments,
                message: '评论添加成功'
            });
        } catch (error) {
            console.error('添加评论错误:', error);
            res.status(500).json({
                success: false,
                message: '服务器错误',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    }
);

/**
 * @route   POST /api/resources/:id/rate
 * @desc    评分资源
 * @access  Private
 */
router.post(
    '/:id/rate',
    [
        protect,
        verifiedOnly,
        check('rating', '评分必须是1-5之间的数字').isInt({ min: 1, max: 5 })
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                errors: errors.array()
            });
        }

        try {
            const resource = await Resource.findById(req.params.id);

            if (!resource) {
                return res.status(404).json({
                    success: false,
                    message: '资源未找到'
                });
            }

            // 检查用户是否已经评分
            const userRatingIndex = resource.ratings.findIndex(
                rating => rating.user.toString() === req.user._id.toString()
            );

            if (userRatingIndex !== -1) {
                // 更新现有评分
                resource.ratings[userRatingIndex].rating = req.body.rating;
            } else {
                // 添加新评分
                resource.ratings.push({
                    user: req.user._id,
                    rating: req.body.rating
                });
            }

            // 重新计算平均评分
            resource.calculateAverageRating();
            await resource.save();

            res.json({
                success: true,
                averageRating: resource.averageRating,
                ratingCount: resource.ratings.length,
                message: '评分成功'
            });
        } catch (error) {
            console.error('评分错误:', error);
            res.status(500).json({
                success: false,
                message: '服务器错误',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    }
);

/**
 * @route   POST /api/resources/:id/like
 * @desc    点赞资源
 * @access  Private
 */
router.post('/:id/like', [protect, verifiedOnly], async (req, res) => {
    try {
        const resource = await Resource.findById(req.params.id);

        if (!resource) {
            return res.status(404).json({
                success: false,
                message: '资源未找到'
            });
        }

        // 增加点赞数
        resource.likes += 1;
        await resource.save({ validateBeforeSave: false });

        res.json({
            success: true,
            likes: resource.likes,
            message: '点赞成功'
        });
    } catch (error) {
        console.error('点赞错误:', error);
        res.status(500).json({
            success: false,
            message: '服务器错误',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

/**
 * @route   GET /api/resources/:id/stream
 * @desc    视频流式播放
 * @access  Public (可以基于业务需求调整为私有)
 */
router.get('/:id/stream', async (req, res) => {
    try {
        const resource = await Resource.findById(req.params.id);

        if (!resource) {
            return res.status(404).json({
                success: false,
                message: '资源未找到'
            });
        }

        if (resource.type !== 'video' || !resource.videoFile) {
            return res.status(400).json({
                success: false,
                message: '此资源不是可流式传输的视频'
            });
        }

        const videoPath = resource.videoFile;
        const videoStat = fs.statSync(videoPath);
        const fileSize = videoStat.size;
        const range = req.headers.range;

        if (range) {
            // 处理范围请求
            const parts = range.replace(/bytes=/, '').split('-');
            const start = parseInt(parts[0], 10);
            const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
            const chunksize = end - start + 1;
            const file = fs.createReadStream(videoPath, { start, end });

            const headers = {
                'Content-Range': `bytes ${start}-${end}/${fileSize}`,
                'Accept-Ranges': 'bytes',
                'Content-Length': chunksize,
                'Content-Type': 'video/mp4' // 根据视频类型调整
            };

            res.writeHead(206, headers);
            file.pipe(res);
        } else {
            // 整个文件
            const headers = {
                'Content-Length': fileSize,
                'Content-Type': 'video/mp4' // 根据视频类型调整
            };

            res.writeHead(200, headers);
            fs.createReadStream(videoPath).pipe(res);
        }
    } catch (error) {
        console.error('视频流错误:', error);
        res.status(500).json({
            success: false,
            message: '服务器错误',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

module.exports = router; 