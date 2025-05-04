// 登录和注册的JavaScript逻辑
document.addEventListener('DOMContentLoaded', function () {
    // 表单切换相关元素
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const switchToRegister = document.getElementById('switch-to-register');
    const switchToLogin = document.getElementById('switch-to-login');
    const formTitle = document.getElementById('form-title');

    // 消息显示相关元素
    const errorMessage = document.getElementById('error-message');
    const successMessage = document.getElementById('success-message');

    // 注册表单中的教师特有字段
    const teacherFields = document.getElementById('teacher-fields');
    const regRoleTeacher = document.getElementById('reg-role-teacher');
    const regRoleStudent = document.getElementById('reg-role-student');

    // 联系方式标签
    const contactTypeSelect = document.getElementById('contact-type');
    const contactLabel = document.getElementById('contact-label');

    const regContactTypeSelect = document.getElementById('reg-contact-type');
    const regContactLabel = document.getElementById('reg-contact-label');

    // 后端API地址
    const API_URL = '/api';

    // 表单切换
    switchToRegister.addEventListener('click', function (e) {
        e.preventDefault();
        loginForm.style.display = 'none';
        registerForm.style.display = 'block';
        switchToRegister.style.display = 'none';
        switchToLogin.style.display = 'block';
        formTitle.textContent = '用户注册';
        hideMessages();
    });

    switchToLogin.addEventListener('click', function (e) {
        e.preventDefault();
        registerForm.style.display = 'none';
        loginForm.style.display = 'block';
        switchToLogin.style.display = 'none';
        switchToRegister.style.display = 'block';
        formTitle.textContent = '用户登录';
        hideMessages();
    });

    // 教师角色切换逻辑
    regRoleTeacher.addEventListener('change', function () {
        if (this.checked) {
            teacherFields.style.display = 'block';
        }
    });

    regRoleStudent.addEventListener('change', function () {
        if (this.checked) {
            teacherFields.style.display = 'none';
        }
    });

    // 登录方式标签更新
    contactTypeSelect.addEventListener('change', function () {
        updateContactLabel(this.value, contactLabel);
    });

    regContactTypeSelect.addEventListener('change', function () {
        updateContactLabel(this.value, regContactLabel);
    });

    // 更新联系方式标签
    function updateContactLabel(contactType, labelElement) {
        switch (contactType) {
            case 'email':
                labelElement.textContent = '邮箱';
                break;
            case 'phone':
                labelElement.textContent = '手机号';
                break;
            case 'username':
                labelElement.textContent = '用户名';
                break;
        }
    }

    // 登录表单提交
    loginForm.addEventListener('submit', async function (e) {
        e.preventDefault();
        hideMessages();

        const contactType = contactTypeSelect.value;
        const contact = document.getElementById('contact').value;
        const password = document.getElementById('password').value;
        const role = document.querySelector('input[name="role"]:checked').value;

        if (!contact || !password) {
            showError('请填写所有必填字段');
            return;
        }

        try {
            const response = await fetch(`${API_URL}/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    contactType,
                    contact,
                    password,
                    role
                })
            });

            const data = await response.json();

            if (!data.success) {
                showError(data.message || '登录失败，请检查您的凭据');
                return;
            }

            // 登录成功，保存token到localStorage
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));

            // 显示成功消息
            showSuccess('登录成功，正在跳转...');

            // 根据角色和返回的重定向URL进行跳转
            setTimeout(() => {
                if (data.redirectUrl) {
                    window.location.href = data.redirectUrl;
                } else {
                    // 如果没有提供重定向URL，使用默认逻辑
                    if (data.user.role === 'student') {
                        window.location.href = '/student-app/';
                    } else if (data.user.role === 'teacher') {
                        window.location.href = '/teacher-app/';
                    } else {
                        window.location.href = '/';
                    }
                }
            }, 1000);

        } catch (error) {
            console.error('登录错误:', error);
            showError('登录请求失败，请稍后再试');
        }
    });

    // 注册表单提交
    registerForm.addEventListener('submit', async function (e) {
        e.preventDefault();
        hideMessages();

        const name = document.getElementById('reg-name').value;
        const contactType = regContactTypeSelect.value;
        const contact = document.getElementById('reg-contact').value;
        const password = document.getElementById('reg-password').value;
        const role = document.querySelector('#register-form input[name="role"]:checked').value;

        if (!name || !contact || !password) {
            showError('请填写所有必填字段');
            return;
        }

        const userData = {
            name,
            contactType,
            contact,
            password,
            role
        };

        // 如果是教师，添加教师特有字段
        if (role === 'teacher') {
            userData.realName = document.getElementById('reg-realname').value;
            userData.subject = document.getElementById('reg-subject').value;
            userData.description = document.getElementById('reg-description').value;
        }

        try {
            const response = await fetch(`${API_URL}/auth/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(userData)
            });

            const data = await response.json();

            if (!data.success) {
                showError(data.message || '注册失败，请检查您的输入');
                return;
            }

            // 注册成功，显示成功消息
            showSuccess(data.message || '注册成功，请登录');

            // 清空注册表单
            registerForm.reset();

            // 自动切换到登录表单
            setTimeout(() => {
                switchToLogin.click();
            }, 2000);

        } catch (error) {
            console.error('注册错误:', error);
            showError('注册请求失败，请稍后再试');
        }
    });

    // 显示错误消息
    function showError(message) {
        errorMessage.textContent = message;
        errorMessage.style.display = 'block';
        successMessage.style.display = 'none';
    }

    // 显示成功消息
    function showSuccess(message) {
        successMessage.textContent = message;
        successMessage.style.display = 'block';
        errorMessage.style.display = 'none';
    }

    // 隐藏所有消息
    function hideMessages() {
        errorMessage.style.display = 'none';
        successMessage.style.display = 'none';
    }

    // 初始化页面
    function init() {
        // 如果已经登录，根据角色跳转到对应页面
        const token = localStorage.getItem('token');
        const user = JSON.parse(localStorage.getItem('user') || '{}');

        if (token && user && user.role) {
            if (user.role === 'student') {
                window.location.href = '/student-app/';
            } else if (user.role === 'teacher') {
                window.location.href = '/teacher-app/';
            }
        }
    }

    // 初始化
    init();
}); 