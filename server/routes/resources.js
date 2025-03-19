const express = require('express');
const router = express.Router();
const Resource = require('../models/Resource');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const jwt = require('jsonwebtoken');

// 文件上传配置
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const dir = path.join(__dirname, '../uploads/resources');
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        cb(null, dir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage,
    limits: { fileSize: 50 * 1024 * 1024 }, // 50MB 限制
    fileFilter: (req, file, cb) => {
        // 允许的文件类型
        const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx|ppt|pptx|xls|xlsx|mp4|webm|mp3|zip/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);

        if (extname && mimetype) {
            return cb(null, true);
        } else {
            cb(new Error('不支持的文件类型'));
        }
    }
});

// JWT 认证中间件
const JWT_SECRET = 'education-resource-distribution-platform-secret';
const authenticateJWT = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (authHeader) {
        const token = authHeader.split(' ')[1];
        jwt.verify(token, JWT_SECRET, (err, user) => {
            if (err) {
                return res.status(403).json({ message: '认证失败，请重新登录' });
            }
            req.user = user;
            next();
        });
    } else {
        res.status(401).json({ message: '未授权，请登录' });
    }
};

// 获取资源列表（分页）
router.get('/', async (req, res) => {
    try {
        const { page = 1, limit = 10, subject, level, type } = req.query;
        const skip = (page - 1) * limit;

        // 构建查询条件
        const query = { isApproved: true };
        if (subject) query.subject = subject;
        if (level) query.level = level;
        if (type) query.type = type;

        const resources = await Resource.find(query)
            .sort({ uploadDate: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        const total = await Resource.countDocuments(query);

        res.json({
            resources,
            total,
            page: parseInt(page),
            pages: Math.ceil(total / limit)
        });
    } catch (error) {
        console.error('获取资源列表失败:', error);
        res.status(500).json({ message: '服务器错误' });
    }
});

// 搜索资源
router.get('/search', async (req, res) => {
    try {
        const { q, subject, level, type, page = 1, limit = 10 } = req.query;
        const skip = (page - 1) * limit;

        // 构建查询条件
        const query = { isApproved: true };
        if (subject) query.subject = subject;
        if (level) query.level = level;
        if (type) query.type = type;

        // 添加全文搜索
        if (q) {
            query.$text = { $search: q };
        }

        const resources = await Resource.find(query)
            .sort({ score: { $meta: 'textScore' } })
            .skip(skip)
            .limit(parseInt(limit));

        const total = await Resource.countDocuments(query);

        res.json({
            resources,
            total,
            page: parseInt(page),
            pages: Math.ceil(total / limit)
        });
    } catch (error) {
        console.error('搜索资源失败:', error);
        res.status(500).json({ message: '服务器错误' });
    }
});

// 获取单个资源
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const resource = await Resource.findById(id);

        if (!resource) {
            return res.status(404).json({ message: '资源不存在' });
        }

        // 增加查看次数
        resource.viewCount += 1;
        await resource.save();

        res.json(resource);
    } catch (error) {
        console.error('获取资源详情失败:', error);
        res.status(500).json({ message: '服务器错误' });
    }
});

// 获取教师的资源
router.get('/teacher/:teacherId', authenticateJWT, async (req, res) => {
    try {
        const { teacherId } = req.params;
        const resources = await Resource.find({ authorId: teacherId }).sort({ uploadDate: -1 });
        res.json(resources);
    } catch (error) {
        console.error('获取教师资源失败:', error);
        res.status(500).json({ message: '服务器错误' });
    }
});

// 上传新资源
router.post('/', authenticateJWT, upload.fields([
    { name: 'resource', maxCount: 1 },
    { name: 'thumbnail', maxCount: 1 }
]), async (req, res) => {
    try {
        const { title, description, subject, type, level, author, authorId, keywords } = req.body;

        // 处理上传的文件
        let url = '';
        let thumbnailUrl = '';
        let fileSize = 0;

        if (req.files.resource) {
            const resourceFile = req.files.resource[0];
            url = `/uploads/resources/${resourceFile.filename}`;
            fileSize = resourceFile.size;
        } else if (req.body.url) {
            url = req.body.url; // 外部链接
        } else {
            return res.status(400).json({ message: '必须提供资源文件或URL' });
        }

        if (req.files.thumbnail) {
            const thumbnailFile = req.files.thumbnail[0];
            thumbnailUrl = `/uploads/resources/${thumbnailFile.filename}`;
        }

        // 创建新资源记录
        const newResource = new Resource({
            title,
            description,
            subject,
            type,
            level,
            url,
            thumbnail: thumbnailUrl,
            author,
            authorId,
            keywords: keywords ? keywords.split(',') : [],
            fileSize,
            uploadDate: new Date(),
            updatedAt: new Date()
        });

        // 处理练习题内容
        if (type === 'exercise' && req.body.content) {
            try {
                newResource.content = JSON.parse(req.body.content);
            } catch (e) {
                console.error('解析练习题内容失败:', e);
            }
        }

        await newResource.save();
        res.status(201).json(newResource);
    } catch (error) {
        console.error('上传资源失败:', error);
        res.status(500).json({ message: '服务器错误' });
    }
});

// 更新资源
router.put('/:id', authenticateJWT, async (req, res) => {
    try {
        const { id } = req.params;
        const { title, description, subject, level, keywords } = req.body;

        const resource = await Resource.findById(id);
        if (!resource) {
            return res.status(404).json({ message: '资源不存在' });
        }

        // 验证权限
        if (resource.authorId.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({ message: '没有权限修改此资源' });
        }

        // 更新资源信息
        resource.title = title || resource.title;
        resource.description = description || resource.description;
        resource.subject = subject || resource.subject;
        resource.level = level || resource.level;
        resource.keywords = keywords ? keywords.split(',') : resource.keywords;
        resource.updatedAt = new Date();

        await resource.save();
        res.json(resource);
    } catch (error) {
        console.error('更新资源失败:', error);
        res.status(500).json({ message: '服务器错误' });
    }
});

// 删除资源
router.delete('/:id', authenticateJWT, async (req, res) => {
    try {
        const { id } = req.params;

        const resource = await Resource.findById(id);
        if (!resource) {
            return res.status(404).json({ message: '资源不存在' });
        }

        // 验证权限
        if (resource.authorId.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({ message: '没有权限删除此资源' });
        }

        // 删除资源文件
        if (resource.url && resource.url.startsWith('/uploads/')) {
            const filePath = path.join(__dirname, '..', resource.url);
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }
        }

        // 删除缩略图
        if (resource.thumbnail && resource.thumbnail.startsWith('/uploads/')) {
            const thumbnailPath = path.join(__dirname, '..', resource.thumbnail);
            if (fs.existsSync(thumbnailPath)) {
                fs.unlinkSync(thumbnailPath);
            }
        }

        await Resource.findByIdAndDelete(id);
        res.json({ message: '资源已删除' });
    } catch (error) {
        console.error('删除资源失败:', error);
        res.status(500).json({ message: '服务器错误' });
    }
});

// 记录资源查看历史
router.post('/resource-views', async (req, res) => {
    try {
        const { userId, resourceId } = req.body;

        // 检查资源是否存在
        const resource = await Resource.findById(resourceId);
        if (!resource) {
            return res.status(404).json({ message: '资源不存在' });
        }

        // 记录访问历史
        const Student = require('../models/Student');
        const student = await Student.findById(userId);

        if (student) {
            // 添加到学习历史
            student.learningHistory.push({
                subject: resource.subject,
                resourceId,
                viewedAt: new Date()
            });

            await student.save();
        }

        res.status(201).json({ message: '访问记录已保存' });
    } catch (error) {
        console.error('记录资源访问失败:', error);
        res.status(500).json({ message: '服务器错误' });
    }
});

// 收藏资源
router.post('/favorites', async (req, res) => {
    try {
        const { userId, resourceId } = req.body;

        // 创建收藏记录
        const Favorite = require('../models/Favorite');

        // 检查是否已经收藏
        const existingFavorite = await Favorite.findOne({ userId, resourceId });
        if (existingFavorite) {
            return res.status(400).json({ message: '已经收藏过此资源' });
        }

        const newFavorite = new Favorite({
            userId,
            resourceId,
            createdAt: new Date()
        });

        await newFavorite.save();
        res.status(201).json(newFavorite);
    } catch (error) {
        console.error('收藏资源失败:', error);
        res.status(500).json({ message: '服务器错误' });
    }
});

// 提交练习题答案
router.post('/exercise-answers', async (req, res) => {
    try {
        const { resourceId, userId, answers } = req.body;

        // 获取练习题资源
        const resource = await Resource.findById(resourceId);
        if (!resource || resource.type !== 'exercise') {
            return res.status(404).json({ message: '练习题不存在' });
        }

        // 检查答案
        const correctAnswers = resource.content.map((question, index) => {
            const userAnswer = answers.find(a => a.questionId === question.id)?.answer;
            return {
                questionId: question.id,
                answer: question.correctAnswer,
                explanation: question.explanation,
                isCorrect: userAnswer === question.correctAnswer
            };
        });

        // 保存答题记录
        const ExerciseAnswer = require('../models/ExerciseAnswer');
        const newAnswer = new ExerciseAnswer({
            userId,
            resourceId,
            answers,
            score: correctAnswers.filter(a => a.isCorrect).length / correctAnswers.length * 100,
            submittedAt: new Date()
        });

        await newAnswer.save();

        res.json({
            correctAnswers,
            score: newAnswer.score
        });
    } catch (error) {
        console.error('提交答案失败:', error);
        res.status(500).json({ message: '服务器错误' });
    }
});

module.exports = router; 