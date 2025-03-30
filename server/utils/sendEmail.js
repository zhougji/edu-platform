const nodemailer = require('nodemailer');

/**
 * 发送电子邮件
 * @param {Object} options - 邮件选项
 * @param {String} options.to - 收件人邮箱
 * @param {String} options.subject - 邮件主题
 * @param {String} options.text - 纯文本内容
 * @param {String} options.html - HTML内容
 */
const sendEmail = async (options) => {
    try {
        // 创建邮件传输器
        const transporter = nodemailer.createTransport({
            service: process.env.EMAIL_SERVICE || 'gmail',
            auth: {
                user: process.env.EMAIL_USERNAME,
                pass: process.env.EMAIL_PASSWORD
            }
        });

        // 定义邮件选项
        const mailOptions = {
            from: `教育平台 <${process.env.EMAIL_FROM}>`,
            to: options.to,
            subject: options.subject,
            text: options.text,
            html: options.html || undefined
        };

        // 发送邮件
        const info = await transporter.sendMail(mailOptions);
        console.log('邮件发送成功:', info.messageId);
        return true;
    } catch (error) {
        console.error('邮件发送失败:', error);
        return false;
    }
};

/**
 * 发送邮箱验证邮件
 * @param {String} email - 用户邮箱
 * @param {String} name - 用户姓名
 * @param {String} token - 验证令牌
 * @param {String} clientURL - 客户端URL
 */
const sendVerificationEmail = async (email, name, token, clientURL) => {
    const verificationURL = `${clientURL}/verify-email/${token}`;

    const subject = '欢迎加入教育平台 - 请验证您的邮箱';
    const text = `亲爱的 ${name}，\n\n欢迎加入教育平台。请点击以下链接验证您的邮箱：\n\n${verificationURL}\n\n此链接将在24小时后失效。\n\n如果您没有注册我们的平台，请忽略此邮件。\n\n谢谢，\n教育平台团队`;

    const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
      <h2 style="color: #4a6ee0;">欢迎加入教育平台！</h2>
      <p>亲爱的 <strong>${name}</strong>，</p>
      <p>感谢您注册教育平台。为了完成注册流程，请验证您的邮箱地址。</p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${verificationURL}" style="background-color: #4a6ee0; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">
          验证邮箱
        </a>
      </div>
      <p>或者，您也可以复制下面的链接到浏览器地址栏：</p>
      <p style="background-color: #f5f5f5; padding: 10px; border-radius: 5px; word-break: break-all;">
        ${verificationURL}
      </p>
      <p>此链接将在24小时后失效。</p>
      <p>如果您没有注册我们的平台，请忽略此邮件。</p>
      <p>谢谢，<br/>教育平台团队</p>
    </div>
  `;

    return sendEmail({
        to: email,
        subject,
        text,
        html
    });
};

/**
 * 发送密码重置邮件
 * @param {String} email - 用户邮箱
 * @param {String} name - 用户姓名
 * @param {String} token - 重置令牌
 * @param {String} clientURL - 客户端URL
 */
const sendPasswordResetEmail = async (email, name, token, clientURL) => {
    const resetURL = `${clientURL}/reset-password/${token}`;

    const subject = '密码重置请求';
    const text = `亲爱的 ${name}，\n\n您收到此邮件是因为您（或其他人）请求重置账户密码。请点击以下链接重置您的密码：\n\n${resetURL}\n\n此链接将在1小时后失效。如果您没有请求重置密码，请忽略此邮件，您的密码将保持不变。\n\n谢谢，\n教育平台团队`;

    const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
      <h2 style="color: #4a6ee0;">密码重置请求</h2>
      <p>亲爱的 <strong>${name}</strong>，</p>
      <p>您收到此邮件是因为您（或其他人）请求重置账户密码。</p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${resetURL}" style="background-color: #4a6ee0; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">
          重置密码
        </a>
      </div>
      <p>或者，您也可以复制下面的链接到浏览器地址栏：</p>
      <p style="background-color: #f5f5f5; padding: 10px; border-radius: 5px; word-break: break-all;">
        ${resetURL}
      </p>
      <p>此链接将在1小时后失效。</p>
      <p>如果您没有请求重置密码，请忽略此邮件，您的密码将保持不变。</p>
      <p>谢谢，<br/>教育平台团队</p>
    </div>
  `;

    return sendEmail({
        to: email,
        subject,
        text,
        html
    });
};

module.exports = {
    sendEmail,
    sendVerificationEmail,
    sendPasswordResetEmail
}; 