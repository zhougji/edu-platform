const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

// 教师模型
const teacherSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    subject: { type: String, required: true },
    title: { type: String, required: true }, // 职称
    introduction: { type: String },
    createdAt: { type: Date, default: Date.now }
});

const Teacher = mongoose.model('Teacher', teacherSchema);

// 获取所有教师
router.get('/', async (req, res) => {
    try {
        const teachers = await Teacher.find().select('-password');
        res.json(teachers);
    } catch (error) {
        res.status(500).json({ message: '获取教师列表失败', error: error.message });
    }
});

// 获取单个教师信息
router.get('/:id', async (req, res) => {
    try {
        const teacher = await Teacher.findById(req.params.id).select('-password');
        if (!teacher) {
            return res.status(404).json({ message: '未找到该教师' });
        }
        res.json(teacher);
    } catch (error) {
        res.status(500).json({ message: '获取教师信息失败', error: error.message });
    }
});

// 创建新教师
router.post('/', async (req, res) => {
    try {
        const { name, email, password, subject, title, introduction } = req.body;
        const teacher = new Teacher({
            name,
            email,
            password,
            subject,
            title,
            introduction
        });
        await teacher.save();
        res.status(201).json({ message: '教师创建成功', teacher: { ...teacher.toObject(), password: undefined } });
    } catch (error) {
        res.status(400).json({ message: '创建教师失败', error: error.message });
    }
});

// 更新教师信息
router.put('/:id', async (req, res) => {
    try {
        const { name, email, subject, title, introduction } = req.body;
        const teacher = await Teacher.findByIdAndUpdate(
            req.params.id,
            { name, email, subject, title, introduction },
            { new: true }
        ).select('-password');

        if (!teacher) {
            return res.status(404).json({ message: '未找到该教师' });
        }
        res.json({ message: '教师信息更新成功', teacher });
    } catch (error) {
        res.status(400).json({ message: '更新教师信息失败', error: error.message });
    }
});

// 删除教师
router.delete('/:id', async (req, res) => {
    try {
        const teacher = await Teacher.findByIdAndDelete(req.params.id);
        if (!teacher) {
            return res.status(404).json({ message: '未找到该教师' });
        }
        res.json({ message: '教师删除成功' });
    } catch (error) {
        res.status(500).json({ message: '删除教师失败', error: error.message });
    }
});

module.exports = router; 