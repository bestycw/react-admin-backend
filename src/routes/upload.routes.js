const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const fsSync = require('fs');

const UPLOAD_DIR = path.resolve(__dirname, '../../uploads'); // 上传文件存储目录
const CHUNK_DIR = path.resolve(__dirname, '../../uploads/chunks'); // 分片存储目录

// 确保上传目录存在
[UPLOAD_DIR, CHUNK_DIR].forEach(dir => {
    if (!fsSync.existsSync(dir)) {
        fsSync.mkdirSync(dir, { recursive: true });
    }
});

// 基本文件上传配置
const basicStorage = multer.diskStorage({
    destination: function (req, file, cb) {
        console.log('Multer destination:', file);
        cb(null, UPLOAD_DIR);
    },
    filename: function (req, file, cb) {
        console.log('Multer filename:', file);
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        const basename = path.basename(file.originalname, ext);
        cb(null, `${basename}-${uniqueSuffix}${ext}`);
    }
});

const basicUpload = multer({
    storage: basicStorage,
    limits: {
        fileSize: 100 * 1024 * 1024 // 限制文件大小为 100MB
    }
}).single('file');

// 基本文件上传路由
router.post('/', (req, res) => {
    console.log('Upload request headers:', req.headers);
    
    basicUpload(req, res, function (err) {
        if (err instanceof multer.MulterError) {
            console.error('Multer error:', err);
            return res.status(400).json({
                code: 400,
                message: `文件上传错误: ${err.message}`
            });
        } else if (err) {
            console.error('Unknown error:', err);
            return res.status(500).json({
                code: 500,
                message: `未知错误: ${err.message}`
            });
        }

        console.log('Upload request body:', req.body);
        console.log('Upload request file:', req.file);

        // 处理文件
        try {
            const file = req.file;
            if (!file) {
                return res.status(400).json({
                    code: 400,
                    message: '没有接收到文件'
                });
            }

            const fileUrl = `/uploads/${file.filename}`;
            
            const response = {
                code: 200,
                data: {
                    fileId: Math.random().toString(36).substr(2, 9),
                    fileName: file.originalname,
                    fileUrl,
                    fileSize: file.size,
                    mimeType: file.mimetype,
                    uploadTime: new Date().toISOString(),
                    message: '文件上传成功'
                }
            };

            console.log('Upload successful:', response);
            res.json(response);
        } catch (error) {
            console.error('Upload error:', error);
            res.status(500).json({
                code: 500,
                message: '文件上传失败',
                error: error.message
            });
        }
    });
});

const storage = multer.diskStorage({
    destination: async function (req, file, cb) {
        console.log('Chunk upload request body:', req.body);
        const { fileHash } = req.body;
        if (!fileHash) {
            return cb(new Error('Missing fileHash'));
        }

        const chunkDir = path.join(CHUNK_DIR, fileHash);
        console.log('Chunk directory:', chunkDir);

        try {
            if (!fsSync.existsSync(chunkDir)) {
                await fs.mkdir(chunkDir, { recursive: true });
            }
            cb(null, chunkDir);
        } catch (error) {
            console.error('Create chunk dir error:', error);
            cb(error);
        }
    },
    filename: function (req, file, cb) {
        const { hash } = req.body;
        if (!hash) {
            return cb(new Error('Missing hash'));
        }
        console.log('Chunk filename:', hash);
        cb(null, hash);
    }
});

const chunkUpload = multer({
    storage,
    limits: {
        fileSize: 5 * 1024 * 1024 // 限制每个分片最大 5MB
    }
}).single('chunk');

// 检查文件是否已上传
router.post('/check', async (req, res) => {
    try {
        console.log('Check request body:', req.body);
        const { fileHash, fileName } = req.body;
        
        if (!fileHash || !fileName) {
            return res.status(400).json({
                code: 1,
                message: '缺少必要参数'
            });
        }

        const filePath = path.join(UPLOAD_DIR, fileName);
        console.log('Checking file path:', filePath);

        // 确保上传目录存在
        if (!fsSync.existsSync(UPLOAD_DIR)) {
            await fs.mkdir(UPLOAD_DIR, { recursive: true });
        }

        const exists = fsSync.existsSync(filePath);
        console.log('File exists:', exists);

        res.json({
            code: 200,
            data: {
                uploaded: exists
            }
        });
    } catch (error) {
        console.error('Check file error:', error);
        res.status(500).json({
            code: 1,
            message: '检查文件状态失败',
            error: error.message
        });
    }
});

// 上传分片
router.post('/chunk', express.urlencoded({ extended: true }), (req, res) => {
    console.log('Received chunk upload request');
    console.log('Headers:', req.body);
    
    // 先解析非文件字段
    const { fileHash, hash, fileName, chunkIndex, totalChunks } = req.body;
    console.log('Request body before upload:', { fileHash, hash, fileName, chunkIndex, totalChunks });

    if (!fileHash || !hash) {
        return res.status(400).json({
            code: 1,
            message: '缺少必要参数'
        });
    }

    const chunkDir = path.join(CHUNK_DIR, fileHash);
    const storage = multer.diskStorage({
        destination: function (req, file, cb) {
            if (!fsSync.existsSync(chunkDir)) {
                fsSync.mkdirSync(chunkDir, { recursive: true });
            }
            cb(null, chunkDir);
        },
        filename: function (req, file, cb) {
            cb(null, hash);
        }
    });

    const chunkUpload = multer({
        storage,
        limits: {
            fileSize: 5 * 1024 * 1024 // 限制每个分片最大 5MB
        }
    }).single('chunk');

    chunkUpload(req, res, function(err) {
        if (err instanceof multer.MulterError) {
            console.error('Multer error:', err);
            return res.status(400).json({
                code: 1,
                message: `分片上传错误: ${err.message}`
            });
        } else if (err) {
            console.error('Chunk upload error:', err);
            return res.status(500).json({
                code: 1,
                message: `分片上传失败: ${err.message}`
            });
        }

        try {
            if (!req.file) {
                return res.status(400).json({
                    code: 1,
                    message: '没有接收到文件分片'
                });
            }

            console.log('Chunk uploaded successfully:', {
                originalname: req.file.originalname,
                filename: req.file.filename,
                size: req.file.size,
                path: req.file.path
            });

            res.json({
                code: 0,
                data: {
                    message: '分片上传成功'
                }
            });
        } catch (error) {
            console.error('Process chunk error:', error);
            res.status(500).json({
                code: 1,
                message: '处理分片失败',
                error: error.message
            });
        }
    });
});

// 合并分片
router.post('/merge', async (req, res) => {
    try {
        const { fileHash, fileName } = req.body;
        const chunkDir = path.join(CHUNK_DIR, fileHash);
        const filePath = path.join(UPLOAD_DIR, fileName);

        // 读取所有分片
        const chunks = await fs.readdir(chunkDir);
        if (!chunks.length) {
            return res.status(400).json({
                code: 1,
                message: '没有找到文件分片'
            });
        }

        // 按照分片序号排序
        chunks.sort((a, b) => {
            const indexA = parseInt(a.split('-')[1]);
            const indexB = parseInt(b.split('-')[1]);
            return indexA - indexB;
        });

        // 创建写入流
        const writeStream = fsSync.createWriteStream(filePath);

        // 依次写入分片
        for (const chunk of chunks) {
            const chunkPath = path.join(chunkDir, chunk);
            const buffer = await fs.readFile(chunkPath);
            await new Promise((resolve, reject) => {
                writeStream.write(buffer, (error) => {
                    if (error) reject(error);
                    else resolve();
                });
            });
            // 删除分片文件
            await fs.unlink(chunkPath);
        }

        // 关闭写入流
        await new Promise((resolve, reject) => {
            writeStream.end((error) => {
                if (error) reject(error);
                else resolve();
            });
        });

        // 删除分片目录
        await fs.rmdir(chunkDir);

        res.json({
            code: 0,
            data: {
                url: `/uploads/${fileName}`,
                message: '文件合并成功'
            }
        });
    } catch (error) {
        console.error('Merge chunks error:', error);
        res.status(500).json({
            code: 1,
            message: '文件合并失败',
            error: error.message
        });
    }
});

module.exports = router; 