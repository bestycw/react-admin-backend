'use strict';
const { sequelize } = require('../models');
const initAdmin = require('./init-admin');

async function initDatabase() {
  try {
    // 强制同步所有表（警告：这将删除所有现有数据）
    await sequelize.sync({ force: true });
    console.log('Database tables have been synchronized');

    // 初始化管理员账号和角色
    await initAdmin();
    
    console.log('Database initialization completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('Database initialization failed:', error);
    process.exit(1);
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  console.log('Starting database initialization...');
  initDatabase();
}

module.exports = initDatabase; 