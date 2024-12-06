module.exports = (sequelize, DataTypes) => {
  const DictItem = sequelize.define('DictItem', {
    dictCode: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: '字典编码'
    },
    itemValue: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: '字典项值'
    },
    itemLabel: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: '字典项标签'
    },
    itemSort: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      comment: '排序'
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

  return DictItem;
}; 