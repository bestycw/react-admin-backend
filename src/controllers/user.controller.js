const db = require('../models');
const { User } = db;
const { Op } = require('sequelize');
const ResponseUtil = require('../utils/response');

exports.getUsers = async (req, res) => {
    try {
        const { 
            current = 1, 
            pageSize = 10, 
            username,
            email,
            status,
            roles 
        } = req.query;

        // 构建查询条件
        const whereConditions = {};
        if (username) {
            whereConditions.username = { [Op.iLike]: `%${username}%` };
        }
        if (email) {
            whereConditions.email = { [Op.iLike]: `%${email}%` };
        }
        if (status) {
            whereConditions.status = status;
        }
        if (roles) {
            whereConditions.roles = roles;
        }

        // 执行分页查询
        const { count, rows } = await User.findAndCountAll({
            where: whereConditions,
            offset: (current - 1) * pageSize,
            limit: parseInt(pageSize),
            attributes: [
                'id', 
                'username', 
                'email', 
                'roles', 
                'status',
                'createdAt',
                'updatedAt',
                'lastLogin'
            ],
            order: [['createdAt', 'DESC']]
        });

        res.json(ResponseUtil.success({
            list: rows,
            total: count,
            current: parseInt(current),
            pageSize: parseInt(pageSize)
        }));
    } catch (error) {
        console.error('获取用户列表失败:', error);
        res.status(500).json(ResponseUtil.error('获取用户列表失败'));
    }
};
