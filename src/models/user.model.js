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
    mobile: {
      type: DataTypes.STRING,
      allowNull: true,
      unique: true,
      validate: {
        is: /^1[3-9]\d{9}$/
      }
    },
    email: {
      type: DataTypes.STRING,
      allowNull: true,
      unique: true,
      validate: {
        isEmail: true
      }
    },
    roles: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      defaultValue: ['user']
    },
    permissions: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      defaultValue: []
    },
    dynamicRoutesList: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      defaultValue: []
    },
    avatar: {
      type: DataTypes.STRING,
      defaultValue: ''
    },
    status: {
      type: DataTypes.ENUM('active', 'inactive', 'banned'),
      defaultValue: 'active'
    },
    lastLogin: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    gender: {
      type: DataTypes.ENUM('male', 'female', 'other'),
      allowNull: true
    },
    birthday: {
      type: DataTypes.DATE,
      allowNull: true
    },
    location: {
      type: DataTypes.STRING,
      allowNull: true
    },
    company: {
      type: DataTypes.STRING,
      allowNull: true
    },
    position: {
      type: DataTypes.STRING,
      allowNull: true
    },
    website: {
      type: DataTypes.STRING,
      allowNull: true,
      validate: {
        isUrl: true
      }
    },
    bio: {
      type: DataTypes.TEXT,
      allowNull: true
    }
  }, {
    hooks: {
      beforeSave: async (user) => {
        if (user.changed('password')) {
          const salt = await bcrypt.genSalt(10);
          user.password = await bcrypt.hash(user.password, salt);
        }
      }
    }
  });

  // 实例方法
  User.prototype.comparePassword = async function(candidatePassword) {
    return bcrypt.compare(candidatePassword, this.password);
  };

  // 移除密码字段
  User.prototype.toJSON = function() {
    const values = { ...this.get() };
    delete values.password;
    return values;
  };

  return User;
}; 