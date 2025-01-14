'use strict';
const bcrypt = require('bcryptjs');

module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define('User', {
    username: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        len: [3, 30]
      }
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        len: [6, 100]
      }
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true
      }
    },
    avatar: {
      type: DataTypes.STRING,
      defaultValue: ''
    },
    status: {
      type: DataTypes.ENUM('active', 'inactive'),
      defaultValue: 'active'
    },
    lastLogin: {
      type: DataTypes.DATE,
      defaultValue: null
    },
    roles: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      defaultValue: ['user']
    },
    permissions: {
      type: DataTypes.JSONB,
      defaultValue: null,
      get() {
        const rawValue = this.getDataValue('permissions');
        return rawValue || {};
      }
    },
    dynamicRoutesList: {
      type: DataTypes.JSONB,
      defaultValue: [],
      get() {
        if (this.roles?.includes('admin')) {
          return ['/'];
        }
        const rawValue = this.getDataValue('dynamicRoutesList');
        return rawValue || [];
      }
    }
  }, {
    tableName: 'users',
    timestamps: true,
    hooks: {
      beforeSave: async (user) => {
        if (user.changed('password')) {
          const salt = await bcrypt.genSalt(10);
          user.password = await bcrypt.hash(user.password, salt);
        }
      }
    }
  });

  User.associate = function(models) {
    User.belongsToMany(models.Role, {
      through: models.UserRole,
      foreignKey: 'userId',
      otherKey: 'roleId',
      as: 'userRoles'
    });
  };

  User.prototype.getFullInfo = async function() {
    const user = this;
    const userRoles = await user.getUserRoles();
    
    let dynamicRoutes = new Set();
    let permissions = {};
    
    for (const role of userRoles) {
      if (role.code === 'admin') {
        return {
          ...user.toJSON(),
          dynamicRoutesList: ['/'],
          permissions: {}
        };
      }
      
      role.dynamicRoutesList?.forEach(route => dynamicRoutes.add(route));
      
      if (role.permissions) {
        Object.entries(role.permissions).forEach(([path, perms]) => {
          permissions[path] = [...new Set([...(permissions[path] || []), ...perms])];
        });
      }
    }

    return {
      ...user.toJSON(),
      dynamicRoutesList: Array.from(dynamicRoutes),
      permissions
    };
  };

  User.prototype.comparePassword = async function(candidatePassword) {
    return bcrypt.compare(candidatePassword, this.password);
  };

  User.prototype.toJSON = function() {
    const values = { ...this.get() };
    delete values.password;
    return values;
  };

  return User;
}; 