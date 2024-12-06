module.exports = (sequelize, DataTypes) => {
  const Dict = sequelize.define('Dict', {
    code: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      comment: '字典编码'
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: '字典名称'
    },
    status: {
      type: DataTypes.ENUM('0', '1'),
      defaultValue: '1',
      comment: '状态（0停用 1正常）'
    },
    remark: {
      type: DataTypes.STRING,
      comment: '备注'
    }
  });

  return Dict;
}; 