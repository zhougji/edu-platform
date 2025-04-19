const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

// 用户数据文件路径
const USER_FILE = path.join(__dirname, '../data/users.json');

// 确保文件存在
if (!fs.existsSync(path.dirname(USER_FILE))) {
    fs.mkdirSync(path.dirname(USER_FILE), { recursive: true });
}

// 如果文件不存在，创建一个空数组
if (!fs.existsSync(USER_FILE)) {
    fs.writeFileSync(USER_FILE, JSON.stringify([]));
}

// 从文件读取用户数据
const readUsers = () => {
    const data = fs.readFileSync(USER_FILE, 'utf8');
    return JSON.parse(data);
};

// 写入用户数据到文件
const writeUsers = (users) => {
    fs.writeFileSync(USER_FILE, JSON.stringify(users, null, 2));
};

// 创建用户
const createUser = async (userData) => {
    try {
        const users = readUsers();

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
            createdAt: new Date().toISOString(),
            lastActive: new Date().toISOString(),
            avatar: userData.avatar || '',
            tokens: []
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

        // 如果是教师，添加教师资料
        if (user.role === 'teacher') {
            user.teacherProfile = {
                realName: userData.realName || user.name,
                subject: userData.subject || '',
                description: userData.description || ''
            };
        }

        // 添加用户到数组
        users.push(user);
        writeUsers(users);

        // 返回不包含密码的用户信息
        const { password, ...userWithoutPassword } = user;
        return userWithoutPassword;
    } catch (error) {
        console.error('创建用户失败:', error);
        throw error;
    }
};

// 通过ID查找用户
const findUserById = (id) => {
    try {
        const users = readUsers();
        return users.find(user => user.id === id);
    } catch (error) {
        console.error('查找用户失败:', error);
        throw error;
    }
};

// 通过凭证类型和内容查找用户
const findUserByCredential = (contactType, contact) => {
    try {
        const users = readUsers();

        if (contactType === 'email') {
            return users.find(user => user.email === contact);
        } else if (contactType === 'phone') {
            return users.find(user => user.phone === contact);
        } else if (contactType === 'username') {
            return users.find(user => user.name === contact);
        } else {
            throw new Error('不支持的联系方式类型');
        }
    } catch (error) {
        console.error('通过凭证查找用户失败:', error);
        throw error;
    }
};

// 检查用户是否存在
const userExists = (contactType, contact) => {
    try {
        const users = readUsers();

        if (contactType === 'email') {
            return users.some(user => user.email === contact);
        } else if (contactType === 'phone') {
            return users.some(user => user.phone === contact);
        } else if (contactType === 'username') {
            return users.some(user => user.name === contact);
        } else {
            throw new Error('不支持的联系方式类型');
        }
    } catch (error) {
        console.error('检查用户是否存在失败:', error);
        throw error;
    }
};

// 更新用户信息
const updateUser = (id, updates) => {
    try {
        const users = readUsers();
        const userIndex = users.findIndex(user => user.id === id);

        if (userIndex === -1) {
            return null;
        }

        // 构建更新后的用户对象
        const user = users[userIndex];

        // 只更新提供了的字段
        for (const [key, value] of Object.entries(updates)) {
            // 排除不允许通过通用更新修改的字段
            if (!['id', 'password', 'role'].includes(key)) {
                user[key] = value;
            }
        }

        // 更新最后活跃时间
        user.lastActive = new Date().toISOString();

        // 如果用户是教师且提供了教师相关信息
        if (user.role === 'teacher' &&
            (updates.realName || updates.subject || updates.description)) {

            if (!user.teacherProfile) {
                user.teacherProfile = {};
            }

            if (updates.realName) {
                user.teacherProfile.realName = updates.realName;
            }
            if (updates.subject) {
                user.teacherProfile.subject = updates.subject;
            }
            if (updates.description) {
                user.teacherProfile.description = updates.description;
            }
        }

        // 保存更新后的用户数组
        users[userIndex] = user;
        writeUsers(users);

        return user;
    } catch (error) {
        console.error('更新用户失败:', error);
        throw error;
    }
};

// 添加token到用户
const addTokenToUser = (id, token) => {
    try {
        const users = readUsers();
        const userIndex = users.findIndex(user => user.id === id);

        if (userIndex === -1) {
            return false;
        }

        // 确保用户有tokens数组
        if (!users[userIndex].tokens) {
            users[userIndex].tokens = [];
        }

        // 添加token
        users[userIndex].tokens.push({
            token,
            createdAt: new Date().toISOString()
        });

        writeUsers(users);
        return true;
    } catch (error) {
        console.error('添加token失败:', error);
        throw error;
    }
};

// 从用户移除token
const removeTokenFromUser = (id, tokenToRemove) => {
    try {
        const users = readUsers();
        const userIndex = users.findIndex(user => user.id === id);

        if (userIndex === -1 || !users[userIndex].tokens) {
            return false;
        }

        // 移除指定token
        users[userIndex].tokens = users[userIndex].tokens.filter(t => t.token !== tokenToRemove);

        writeUsers(users);
        return true;
    } catch (error) {
        console.error('移除token失败:', error);
        throw error;
    }
};

// 验证token是否有效
const isValidToken = (id, tokenToCheck) => {
    try {
        const user = findUserById(id);

        if (!user || !user.tokens) {
            return false;
        }

        return user.tokens.some(t => t.token === tokenToCheck);
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

// 获取所有用户
const getAllUsers = (page = 1, limit = 20, role = null) => {
    try {
        const users = readUsers();
        let filteredUsers = users;

        // 如果指定了角色，进行筛选
        if (role) {
            filteredUsers = users.filter(user => user.role === role);
        }

        // 计算分页
        const startIndex = (page - 1) * limit;
        const endIndex = page * limit;
        const paginatedUsers = filteredUsers.slice(startIndex, endIndex);

        // 移除敏感信息
        const safeUsers = paginatedUsers.map(user => {
            const { password, tokens, ...userWithoutSensitiveInfo } = user;
            return userWithoutSensitiveInfo;
        });

        return {
            users: safeUsers,
            pagination: {
                total: filteredUsers.length,
                page,
                limit,
                totalPages: Math.ceil(filteredUsers.length / limit)
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