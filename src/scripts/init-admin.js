'use strict';
const { User, Role, UserRole, sequelize } = require('../models');
const bcrypt = require('bcryptjs');

async function initAdmin() {
  try {
    await sequelize.sync({ force: true });
    await sequelize.transaction(async (t) => {
      // 创建管理员角色
      const adminRole = await Role.create({
        name: '管理员',
        description: '系统管理员',
        code: 'admin',
        status: 'active',
        permissions:{},
        dynamicRoutesList: ['/']  // 管理员拥有所有路由权限
      }, { transaction: t });

      // 创建管理员用户
      const adminUser = await User.create({
        username: 'admin',
        password: '123456',
        email: 'admin@example.com',
        status: 'active',
        roles: ['admin'],
        permissions: null,
        dynamicRoutesList: ['/']  // 管理员用户也拥有所有路由权限
      }, { transaction: t });

      // 使用关联表直接创建关系
      await UserRole.create({
        userId: adminUser.id,
        roleId: adminRole.id
      }, { transaction: t });

      // 创建普通用户角色
      await Role.create({
        name: '普通用户',
        description: '普通用户',
        code: 'user',
        status: 'active',
        permissions: {},
        dynamicRoutesList: ['/dashboard']  // 普通用户只有仪表盘路由权限
      }, { transaction: t });

      console.log('Admin user and roles created successfully');
    });

  } catch (error) {
    console.error('Error creating admin:', error);
    throw error;
  }
}

module.exports = initAdmin;

// 如果直接运行此脚本
if (require.main === module) {
  initAdmin().then(() => {
    console.log('Initialization completed');
    process.exit(0);
  }).catch(err => {
    console.error('Initialization failed:', err);
    process.exit(1);
  });
} 