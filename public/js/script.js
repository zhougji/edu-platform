document.addEventListener('DOMContentLoaded', function () {
    // 初始化轮播图
    const swiper = new Swiper('.swiper', {
        loop: true,
        autoplay: {
            delay: 5000,
            disableOnInteraction: false,
        },
        pagination: {
            el: '.swiper-pagination',
            clickable: true,
        },
        navigation: {
            nextEl: '.swiper-button-next',
            prevEl: '.swiper-button-prev',
        }
    });

    // 移动端菜单
    const menuToggle = document.querySelector('.menu-toggle');
    const mobileMenu = document.getElementById('mobileMenu');

    menuToggle.addEventListener('click', function () {
        mobileMenu.classList.toggle('active');
        // 切换菜单按钮样式
        const spans = this.querySelectorAll('span');

        if (mobileMenu.classList.contains('active')) {
            spans[0].style.transform = 'rotate(45deg) translate(5px, 5px)';
            spans[1].style.opacity = '0';
            spans[2].style.transform = 'rotate(-45deg) translate(7px, -7px)';
        } else {
            spans[0].style.transform = 'none';
            spans[1].style.opacity = '1';
            spans[2].style.transform = 'none';
        }
    });

    // 角色选择模态框
    const modal = document.getElementById('roleModal');
    const loginBtn = document.getElementById('loginBtn');
    const registerBtn = document.getElementById('registerBtn');
    const mobileLoginBtn = document.getElementById('mobileLoginBtn');
    const mobileRegisterBtn = document.getElementById('mobileRegisterBtn');
    const closeModal = document.querySelector('.close');
    const modalTitle = document.getElementById('modalTitle');
    const studentBtn = document.getElementById('studentBtn');
    const teacherBtn = document.getElementById('teacherBtn');

    // 打开登录模态框
    function openLoginModal() {
        modalTitle.textContent = '选择登录入口';
        modal.classList.add('active');
    }

    // 打开注册模态框
    function openRegisterModal() {
        modalTitle.textContent = '选择注册入口';
        modal.classList.add('active');
    }

    // 关闭模态框
    function closeModalFunction() {
        modal.classList.remove('active');
    }

    // 登录按钮点击事件
    loginBtn.addEventListener('click', openLoginModal);
    mobileLoginBtn.addEventListener('click', function (e) {
        e.preventDefault();
        mobileMenu.classList.remove('active');
        openLoginModal();
    });

    // 注册按钮点击事件
    registerBtn.addEventListener('click', openRegisterModal);
    mobileRegisterBtn.addEventListener('click', function (e) {
        e.preventDefault();
        mobileMenu.classList.remove('active');
        openRegisterModal();
    });

    // 关闭模态框
    closeModal.addEventListener('click', closeModalFunction);

    // 点击模态框外部关闭
    window.addEventListener('click', function (e) {
        if (e.target === modal) {
            closeModalFunction();
        }
    });

    // 学生按钮点击事件
    studentBtn.addEventListener('click', function () {
        const action = modalTitle.textContent.includes('登录') ? 'login' : 'register';
        window.location.href = `/student/${action}`;
    });

    // 教师按钮点击事件
    teacherBtn.addEventListener('click', function () {
        const action = modalTitle.textContent.includes('登录') ? 'login' : 'register';
        window.location.href = `/teacher/${action}`;
    });

    // 表单提交
    const contactForm = document.querySelector('.contact-form');
    if (contactForm) {
        contactForm.addEventListener('submit', function (e) {
            e.preventDefault();
            // 这里可以添加表单提交逻辑
            alert('感谢您的留言，我们会尽快回复！');
            this.reset();
        });
    }

    // 平滑滚动
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();

            // 关闭移动菜单（如果打开）
            if (mobileMenu.classList.contains('active')) {
                mobileMenu.classList.remove('active');
                const spans = menuToggle.querySelectorAll('span');
                spans[0].style.transform = 'none';
                spans[1].style.opacity = '1';
                spans[2].style.transform = 'none';
            }

            // 滚动到目标位置
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                const headerHeight = document.querySelector('header').offsetHeight;
                const targetPosition = target.getBoundingClientRect().top + window.pageYOffset;

                window.scrollTo({
                    top: targetPosition - headerHeight,
                    behavior: 'smooth'
                });
            }
        });
    });

    // 添加滚动动画效果
    const animateOnScroll = function () {
        const elements = document.querySelectorAll('.animate-on-scroll');

        elements.forEach(element => {
            const elementPosition = element.getBoundingClientRect().top;
            const windowHeight = window.innerHeight;

            if (elementPosition < windowHeight - 100) {
                element.classList.add('animated');
            }
        });
    };

    // 初始化滚动动画
    window.addEventListener('scroll', animateOnScroll);
    document.addEventListener('DOMContentLoaded', animateOnScroll);

    // 为特性卡片添加动画类
    document.querySelectorAll('.feature-card').forEach((card, index) => {
        card.classList.add('animate-on-scroll');
        card.style.animationDelay = `${index * 0.1}s`;
    });

    // 为关于我们部分添加动画
    document.querySelector('.about .image').classList.add('animate-on-scroll');
    document.querySelector('.about .text').classList.add('animate-on-scroll');
}); 