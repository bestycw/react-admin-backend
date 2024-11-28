const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    host: 'smtp.example.com',  // 邮件服务器地址
    port: 587,                 // 端口
    secure: false,             // true for 465, false for other ports
    auth: {
        user: 'your-email@example.com',  // 邮箱账号
        pass: 'your-password'            // 邮箱密码或应用专用密码
    }
});

module.exports = transporter; 