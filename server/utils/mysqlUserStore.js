const bcrypt = require('bcryptjs');
const { pool } = require('../config/db');
const { v4: uuidv4 } = require('uuid');

// 创建用户
const createUser = async (userData) => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        // 生成唯一ID
        const id = uuidv4();

        // 密码加密
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(userData.password, salt);

        // 准备用户数据
        const user = {
            id,
            name: userData.name,
            password: hashedPassword,
            role: userData.role || 'student',
            createdAt: new Date(),
            lastActive: new Date(),
            avatar: userData.avatar || ''
        };

        // 根据contactType设置email或phone
        if (userData.contactType === 'email') {
            user.email = userData.contact;
        } else if (userData.contactType === 'phone') {
            user.phone = userData.contact;
        } else if (userData.contactType === 'username') {
            // 为保持兼容，用户名存储在name字段
            user.name = userData.contact;
        }

        // 插入用户基本信息
        const [result] = await connection.execute(
            `INSERT INTO users (id, name, email, phone, password, role, avatar, createdAt, lastActive) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                user.id,
                user.name,
                user.email || null,
                user.phone || null,
                user.password,
                user.role,
                user.avatar,
                user.createdAt,
                user.lastActive
            ]
        );

        // 如果是教师，添加教师资料
        if (user.role === 'teacher') {
            await connection.execute(
                `INSERT INTO teacher_profiles (userId, realName, subject, description) 
                 VALUES (?, ?, ?, ?)`,
                [
                    user.id,
                    userData.realName || user.name,
                    userData.subject || '',
                    userData.description || ''
                ]
            );
        }

        await connection.commit();

        // 返回不包含密码的用户信息
        const { password, ...userWithoutPassword } = user;
        return userWithoutPassword;
    } catch (error) {
        await connection.rollback();
        console.error('创建用户失败:', error);
        throw error;
    } finally {
        connection.release();
    }
};

// 通过ID查找用户
const findUserById = async (id) => {
    try {
        // 查询用户基本信息
        const [users] = await pool.execute(
            `SELECT * FROM users WHERE id = ?`,
            [id]
        );

        if (users.length === 0) {
            return null;
        }

        const user = users[0];

        // 如果是教师，还需获取教师信息
        if (user.role === 'teacher') {
            const [teacherProfiles] = await pool.execute(
                `SELECT * FROM teacher_profiles WHERE userId = ?`,
                [id]
            );

            if (teacherProfiles.length > 0) {
                const teacherProfile = teacherProfiles[0];
                Object.assign(user, {
                    realName: teacherProfile.realName,
                    subject: teacherProfile.subject,
                    description: teacherProfile.description
                });
            }
        }

        // 获取用户令牌
        const [tokens] = await pool.execute(
            `SELECT token, createdAt FROM user_tokens WHERE userId = ?`,
            [id]
        );

        user.tokens = tokens;

        return user;
    } catch (error) {
        console.error('查找用户失败:', error);
        throw error;
    }
};

// 通过凭证类型和内容查找用户
const findUserByCredential = async (contactType, contact) => {
    try {
        let query = '';

        // 根据联系方式类型确定查询字段
        if (contactType === 'email') {
            query = 'SELECT * FROM users WHERE email = ?';
        } else if (contactType === 'phone') {
            query = 'SELECT * FROM users WHERE phone = ?';
        } else if (contactType === 'username') {
            query = 'SELECT * FROM users WHERE name = ?';
        } else {
            throw new Error('不支持的联系方式类型');
        }

        const [users] = await pool.execute(query, [contact]);

        if (users.length === 0) {
            return null;
        }

        const user = users[0];

        // 如果是教师，获取教师信息
        if (user.role === 'teacher') {
            const [teacherProfiles] = await pool.execute(
                `SELECT * FROM teacher_profiles WHERE userId = ?`,
                [user.id]
            );

            if (teacherProfiles.length > 0) {
                const teacherProfile = teacherProfiles[0];
                Object.assign(user, {
                    realName: teacherProfile.realName,
                    subject: teacherProfile.subject,
                    description: teacherProfile.description
                });
            }
        }

        // 获取用户令牌
        const [tokens] = await pool.execute(
            `SELECT token, createdAt FROM user_tokens WHERE userId = ?`,
            [user.id]
        );

        user.tokens = tokens;

        return user;
    } catch (error) {
        console.error('通过凭证查找用户失败:', error);
        throw error;
    }
};

// 检查用户是否存在
const userExists = async (contactType, contact) => {
    try {
        let query = '';

        if (contactType === 'email') {
            query = 'SELECT COUNT(*) as count FROM users WHERE email = ?';
        } else if (contactType === 'phone') {
            query = 'SELECT COUNT(*) as count FROM users WHERE phone = ?';
        } else if (contactType === 'username') {
            query = 'SELECT COUNT(*) as count FROM users WHERE name = ?';
        } else {
            throw new Error('不支持的联系方式类型');
        }

        const [result] = await pool.execute(query, [contact]);
        return result[0].count > 0;
    } catch (error) {
        console.error('检查用户是否存在失败:', error);
        throw error;
    }
};

// 更新用户信息
const updateUser = async (id, updates) => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        // 首先获取现有用户信息
        const [users] = await connection.execute(
            `SELECT * FROM users WHERE id = ?`,
            [id]
        );

        if (users.length === 0) {
            return null;
        }

        // 构建更新字段和参数
        const user = users[0];
        const updateFields = [];
        const updateParams = [];

        // 只更新提供了的字段
        for (const [key, value] of Object.entries(updates)) {
            // 排除不允许通过通用更新修改的字段
            if (!['id', 'password', 'role'].includes(key)) {
                updateFields.push(`${key} = ?`);
                updateParams.push(value);
            }
        }

        // 始终更新lastActive字段
        updateFields.push('lastActive = ?');
        updateParams.push(new Date());

        // 添加ID作为WHERE条件
        updateParams.push(id);

        // 如果有要更新的字段，执行更新
        if (updateFields.length > 0) {
            const updateQuery = `UPDATE users SET ${updateFields.join(', ')} WHERE id = ?`;
            await connection.execute(updateQuery, updateParams);
        }

        // 如果用户是教师且提供了教师相关信息
        if (user.role === 'teacher' &&
            (updates.realName || updates.subject || updates.description)) {
            // 先检查教师资料是否存在
            const [profiles] = await connection.execute(
                `SELECT * FROM teacher_profiles WHERE userId = ?`,
                [id]
            );

            const teacherFields = [];
            const teacherParams = [];

            if (updates.realName) {
                teacherFields.push('realName = ?');
                teacherParams.push(updates.realName);
            }
            if (updates.subject) {
                teacherFields.push('subject = ?');
                teacherParams.push(updates.subject);
            }
            if (updates.description) {
                teacherFields.push('description = ?');
                teacherParams.push(updates.description);
            }

            if (teacherFields.length > 0) {
                teacherParams.push(id);

                if (profiles.length > 0) {
                    // 更新现有教师资料
                    const updateTeacherQuery = `UPDATE teacher_profiles SET ${teacherFields.join(', ')} WHERE userId = ?`;
                    await connection.execute(updateTeacherQuery, teacherParams);
                } else {
                    // 创建新教师资料
                    await connection.execute(
                        `INSERT INTO teacher_profiles (userId, realName, subject, description) 
                         VALUES (?, ?, ?, ?)`,
                        [
                            id,
                            updates.realName || user.name,
                            updates.subject || '',
                            updates.description || ''
                        ]
                    );
                }
            }
        }

        await connection.commit();

        // 返回更新后的用户信息
        return await findUserById(id);
    } catch (error) {
        await connection.rollback();
        console.error('更新用户失败:', error);
        throw error;
    } finally {
        connection.release();
    }
};

// 添加token到用户
const addTokenToUser = async (id, token) => {
    try {
        await pool.execute(
            `INSERT INTO user_tokens (userId, token) VALUES (?, ?)`,
            [id, token]
        );
        return true;
    } catch (error) {
        console.error('添加token失败:', error);
        throw error;
    }
};

// 从用户移除token
const removeTokenFromUser = async (id, tokenToRemove) => {
    try {
        await pool.execute(
            `DELETE FROM user_tokens WHERE userId = ? AND token = ?`,
            [id, tokenToRemove]
        );
        return true;
    } catch (error) {
        console.error('移除token失败:', error);
        throw error;
    }
};

// 验证token是否有效
const isValidToken = async (id, tokenToCheck) => {
    try {
        const [tokens] = await pool.execute(
            `SELECT COUNT(*) as count FROM user_tokens WHERE userId = ? AND token = ?`,
            [id, tokenToCheck]
        );
        return tokens[0].count > 0;
    } catch (error) {
        console.error('验证token失败:', error);
        throw error;
    }
};

// 验证密码
const verifyPassword = async (plainPassword, hashedPassword) => {
    try {
        return await bcrypt.compare(plainPassword, hashedPassword);
    } catch (error) {
        console.error('验证密码失败:', error);
        throw error;
    }
};

// 获取所有用户（可分页）
const getAllUsers = async (page = 1, limit = 20, role = null) => {
    try {
        let query = 'SELECT id, name, email, phone, role, avatar, createdAt, lastActive FROM users';
        const params = [];

        if (role) {
            query += ' WHERE role = ?';
            params.push(role);
        }

        query += ' ORDER BY createdAt DESC LIMIT ? OFFSET ?';
        params.push(limit, (page - 1) * limit);

        const [users] = await pool.execute(query, params);

        // 获取总数
        let countQuery = 'SELECT COUNT(*) as total FROM users';
        if (role) {
            countQuery += ' WHERE role = ?';
        }

        const [countResult] = await pool.execute(countQuery, role ? [role] : []);
        const total = countResult[0].total;

        return {
            users,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            }
        };
    } catch (error) {
        console.error('获取用户列表失败:', error);
        throw error;
    }
};

module.exports = {
    createUser,
    findUserById,
    findUserByCredential,
    userExists,
    updateUser,
    addTokenToUser,
    removeTokenFromUser,
    isValidToken,
    verifyPassword,
    getAllUsers
}; 