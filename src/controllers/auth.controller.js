const db = require('../models');
const { User } = db;
const { Op } = db.Sequelize;
const { sendVerificationCode, verifyCode } = require('../services/sms.service');

exports.register = async (req, res) => {
  try {
    const { username, password, mobile, verificationCode } = req.body;

    // 验证验证码
    if (!verifyCode(mobile, verificationCode, 'register')) {
      return res.status(400).json({ 
        code: 400,
        message: '验证码错误或已过期' 
      });
    }

    // 检查用户名是否已存在
    const existingUser = await User.findOne({ 
      where: { 
        [Op.or]: [
          { username },
          { mobile }
        ]
      }
    });
    
    if (existingUser) {
      return res.status(400).json({ 
        code: 400,
        message: '用户名或手机号已被注册' 
      });
    }

    // 创建新用户
    const user = await User.create({
      username,
      password,
      mobile,
      roles: ['user'],
      permissions: [],
      dynamicRoutesList: []
    });

    res.status(200).json({ 
      code: 200,
      message: '注册成功' 
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ 
      code: 500,
      message: '注册失败，请稍后重试' 
    });
  }
};

exports.sendVerificationCode = async (req, res) => {
  try {
    const { mobile, type } = req.body;
    const result = await sendVerificationCode(mobile, type);
    res.json({
      code: 200,
      data: {
        verifyCode: result.code
      },
      message: result.message
    });
  } catch (error) {
    console.error('Send code error:', error);
    res.status(500).json({ 
      code: 500,
      message: '发送验证码失败' 
    });
  }
}; 