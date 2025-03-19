const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

// 学生模型
const studentSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    grade: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
});

const Student = mongoose.model('Student', studentSchema);

// 获取所有学生
router.get('/', async (req, res) => {
    try {
        const students = await Student.find().select('-password');
        res.json(students);
    } catch (error) {
        res.status(500).json({ message: '获取学生列表失败', error: error.message });
    }
});

// 获取单个学生信息
router.get('/:id', async (req, res) => {
    try {
        const student = await Student.findById(req.params.id).select('-password');
        if (!student) {
            return res.status(404).json({ message: '未找到该学生' });
        }
        res.json(student);
    } catch (error) {
        res.status(500).json({ message: '获取学生信息失败', error: error.message });
    }
});

// 创建新学生
router.post('/', async (req, res) => {
    try {
        const { name, email, password, grade } = req.body;
        const student = new Student({
            name,
            email,
            password,
            grade
        });
        await student.save();
        res.status(201).json({ message: '学生创建成功', student: { ...student.toObject(), password: undefined } });
    } catch (error) {
        res.status(400).json({ message: '创建学生失败', error: error.message });
    }
});

// 更新学生信息
router.put('/:id', async (req, res) => {
    try {
        const { name, email, grade } = req.body;
        const student = await Student.findByIdAndUpdate(
            req.params.id,
            { name, email, grade },
            { new: true }
        ).select('-password');

        if (!student) {
            return res.status(404).json({ message: '未找到该学生' });
        }
        res.json({ message: '学生信息更新成功', student });
    } catch (error) {
        res.status(400).json({ message: '更新学生信息失败', error: error.message });
    }
});

// 删除学生
router.delete('/:id', async (req, res) => {
    try {
        const student = await Student.findByIdAndDelete(req.params.id);
        if (!student) {
            return res.status(404).json({ message: '未找到该学生' });
        }
        res.json({ message: '学生删除成功' });
    } catch (error) {
        res.status(500).json({ message: '删除学生失败', error: error.message });
    }
});

module.exports = router; 