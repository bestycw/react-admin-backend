'use strict';

const db = require('../models');
require('dotenv').config();

async function initAdmin() {
  try {
    // 同步数据库模型
    await db.sequelize.sync({ force: true });
    console.log('Database synchronized');

    // 创建管理员用户
    const admin = await db.User.create({
      username: 'admin',
      password: '123456',
      email: 'admin@example.com',
      role: 'admin',
      status: 'active',
      avatar: 'https://gw.alipayobjects.com/zos/rmsportal/BiazfanxmamNRoxxVxka.png'
    });

    console.log('Admin user created successfully:', admin.toJSON());
    process.exit(0);
  } catch (error) {
    console.error('Error creating admin user:', error);
    process.exit(1);
  }
}

// 确认用户真的想要重置数据库
console.log('\x1b[31m%s\x1b[0m', 'WARNING: This will delete all existing data in the database!');
console.log('Press CTRL+C to cancel or wait 5 seconds to continue...');

setTimeout(() => {
  initAdmin().catch(error => {
    console.error('Failed to initialize admin:', error);
    process.exit(1);
  });
}, 5000); 