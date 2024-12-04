'use strict';

module.exports = (sequelize, DataTypes) => {
  const Role = sequelize.define('Role', {
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    description: {
      type: DataTypes.STRING,
      allowNull: true
    },
    code: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    permissions: {
      type: DataTypes.JSONB,
      defaultValue: [],
      get() {
        const rawValue = this.getDataValue('permissions');
        return rawValue || [];
      }
    },
    status: {
      type: DataTypes.STRING,
      defaultValue: 'active'
    },
    dynamicRoutesList: {
      type: DataTypes.JSONB,
      defaultValue: [],
      get() {
        const rawValue = this.getDataValue('dynamicRoutesList');
        // 如果是管理员角色且权限为 ['*']，返回所有路由
        if (this.getDataValue('code') === 'admin' && 
            this.getDataValue('permissions')?.includes('*')) {
          return ['*']; // 管理员返回 * 表示所有路由权限
        }
        return rawValue || [];
      }
    }
  }, {
    tableName: 'roles',
    timestamps: true
  });

  Role.associate = function(models) {
    Role.belongsToMany(models.User, {
      through: models.UserRole,
      foreignKey: 'roleId',
      otherKey: 'userId',
      as: 'users'
    });
  };

  // 添加一个获取默认路由的静态方法
  Role.getDefaultRoutes = function(roleCode) {
    const routesMap = {
      admin: ['*'], // 管理员拥有所有路由权限
      user: ['/dashboard'] // 普通用户只有仪表盘权限
    };
    return routesMap[roleCode] || [];
  };

  return Role;
}; 