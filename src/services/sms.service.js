// 存储验证码的Map，key为手机号，value为{code: string, expiry: number}
const verificationCodes = new Map();

// 生成随机验证码
const generateCode = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};

// 验证码有效期（分钟）
const CODE_EXPIRY = 5;

// 发送验证码
exports.sendVerificationCode = async (mobile, type) => {
    try {
        // 生成6位随机验证码
        const code = generateCode();
        
        // 存储验证码和过期时间
        verificationCodes.set(mobile, {
            code,
            expiry: Date.now() + CODE_EXPIRY * 60 * 1000,
            type
        });

        // 开发环境下返回验证码
        return {
            code,
            message: '验证码发送成功'
        };
    } catch (error) {
        console.error('Send verification code error:', error);
        throw error;
    }
};

// 验证验证码
exports.verifyCode = (mobile, code, type) => {
  console.log('Verifying code:', { mobile, code, type }); // 添加日志
  console.log('Stored codes:', verificationCodes); // 添加日志

  const storedData = verificationCodes.get(mobile);
  
  if (!storedData) {
    console.log('No stored code found for mobile:', mobile);
    return false;
  }

  // 验证码是否过期
  if (Date.now() > storedData.expiry) {
    console.log('Code expired. Current time:', Date.now(), 'Expiry:', storedData.expiry);
    verificationCodes.delete(mobile);
    return false;
  }

  // 验证码类型是否匹配
  if (storedData.type !== type) {
    console.log('Code type mismatch. Expected:', type, 'Got:', storedData.type);
    return false;
  }

  // 验证码是否正确
  const isValid = storedData.code === code;
  console.log('Code validation result:', isValid);

  // 验证成功后删除验证码
  if (isValid) {
    verificationCodes.delete(mobile);
  }

  return isValid;
}; 