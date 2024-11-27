const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const WebSocket = require('ws');

// 模拟流式响应的文本
const sampleText = `
这是一个模拟的流式响应示例。
它会像 ChatGPT 一样逐字输出。
我们可以在这里放入任何文本内容：

1. 支持多行文本
2. 支持标点符号
3. 支持数字和特殊字符
4. 可以模拟思考和停顿

让我们来测试一下代码片段：

\`\`\`javascript
function hello() {
  console.log("Hello, World!");
}
\`\`\`

现在测试一下中文和英文混合：
Hello, 你好！
This is a test. 这是一个测试。
`;

// 配置 multer，指定文件存储位置和文件名
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, '../../uploads');
    // 确保上传目录存在
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    // 保留原始文件名和扩展名
    const ext = path.extname(file.originalname);
    const basename = path.basename(file.originalname, ext);
    cb(null, `${basename}-${uniqueSuffix}${ext}`);
  }
});

const upload = multer({ 
  storage,
  limits: {
    fileSize: 100 * 1024 * 1024, // 限制文件大小为 100MB
  }
});

module.exports = (io) => {
  // WebRTC 信令处理
  io.on('connection', (socket) => {
    console.log('New client connected');

    socket.on('webrtc', (data) => {
      socket.to(data.room).emit('webrtc', data);
      
      if (data.type === 'join') {
        socket.join(data.room);
      }
    });

    socket.on('disconnect', () => {
      console.log('Client disconnected');
    });
  });

  // OPTIONS 预检请求处理
  router.options('/stream/chat', (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Accept, Cache-Control, Connection');
    res.setHeader('Access-Control-Expose-Headers', 'Content-Type');
    res.status(200).end();
  });

  // 流式响应接口
  router.get('/stream/chat', (req, res) => {
    // 设置 CORS 和 SSE 相关的响应头
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Accept, Cache-Control, Connection');
    res.setHeader('Access-Control-Expose-Headers', 'Content-Type');

    const text = sampleText;
    const chars = text.split('');
    let index = 0;

    // 模拟打字效果
    const interval = setInterval(() => {
      if (index < chars.length) {
        // 发送当前字符
        const data = `data: ${JSON.stringify({
          text: chars[index],
          done: false
        })}\n\n`;
        
        res.write(data);
        
        // 确保数据立即发送
        if (res.flush) {
          res.flush();
        }
        
        index++;
      } else {
        // 发送完成标记
        res.write(`data: ${JSON.stringify({
          text: '',
          done: true
        })}\n\n`);
        clearInterval(interval);
        res.end();
      }
    }, 50);

    // 连接关闭时清理
    req.on('close', () => {
      clearInterval(interval);
    });
  });

  // GET 请求测试
  router.get('/test', (req, res) => {
    res.json({
      code: 200,
      data: {
        message: 'GET 请求成功',
        query: req.query,
        time: new Date().toISOString()
      }
    });
  });

  // POST 请求测试
  router.post('/test', (req, res) => {
    res.json({
      code: 200,
      data: {
        message: 'POST 请求成功',
        body: req.body,
        time: new Date().toISOString()
      }
    });
  });

  // PUT 请求测试
  router.put('/test/:id', (req, res) => {
    res.json({
      code: 200,
      data: {
        message: 'PUT 请求成功',
        id: req.params.id,
        body: req.body,
        time: new Date().toISOString()
      }
    });
  });

  // DELETE 请求测试
  router.delete('/test/:id', (req, res) => {
    res.json({
      code: 200,
      data: {
        message: 'DELETE 请求成功',
        id: req.params.id,
        time: new Date().toISOString()
      }
    });
  });

  // // 文件上传测试
  // router.post('/upload', upload.single('file'), (req, res) => {
  //   try {
  //     console.log('监测上传服务')
  //     const file = req.file;
  //     if (!file) {
  //       return res.status(400).json({
  //         code: 400,
  //         message: '没有接收到文件'
  //       });
  //     }

  //     // 构建文件URL
  //     const fileUrl = `/uploads/${file.filename}`;
      
  //     res.json({
  //       code: 200,
  //       data: {
  //         fileId: Math.random().toString(36).substr(2, 9),
  //         fileName: file.originalname,
  //         fileUrl,
  //         fileSize: file.size,
  //         mimeType: file.mimetype,
  //         uploadTime: new Date().toISOString(),
  //         message: '文件上传成功'
  //       }
  //     });
  //   } catch (error) {
  //     console.error('Upload error:', error);
  //     res.status(500).json({
  //       code: 500,
  //       message: '文件上传失败',
  //       error: error.message
  //     });
  //   }
  // });

  // 重试请求测试
  let retryCount = 0;
  router.get('/test-retry', (req, res) => {
    retryCount++;
    
    // 前两次请求模拟失败
    if (retryCount <= 2) {
      res.status(500).json({
        code: 500,
        message: `第 ${retryCount} 次请求失败，将自动重试`
      });
      return;
    }

    // 第三次请求成功
    res.json({
      code: 200,
      data: {
        message: `重试成功，共重试 ${retryCount - 1} 次`,
        time: new Date().toISOString()
      }
    });

    // 重置计数器
    retryCount = 0;
  });

  // 文件下载测试
  router.get('/download/:type', (req, res) => {
    try {
      const { type } = req.params;
      const filePath = path.join(__dirname, `../../samples/sample.${type}`);
      
      // 如果文件不存在，生成一个示例文件
      if (!fs.existsSync(filePath)) {
        const sampleContent = `这是一个示例${type}文件，用于测试下载功能。
生成时间：${new Date().toISOString()}
文件类型：${type}`;
        
        // 确保目录存在
        const dir = path.dirname(filePath);
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
        }
        
        fs.writeFileSync(filePath, sampleContent);
      }

      // 设置响应头
      res.setHeader('Content-Type', 'application/octet-stream');
      res.setHeader('Content-Disposition', `attachment; filename=sample.${type}`);

      // 创建文件读取流并pipe到响应
      const fileStream = fs.createReadStream(filePath);
      fileStream.pipe(res);

      // 错误处理
      fileStream.on('error', (error) => {
        console.error('File stream error:', error);
        res.status(500).json({
          code: 500,
          message: '文件下载失败',
          error: error.message
        });
      });
    } catch (error) {
      console.error('Download error:', error);
      res.status(500).json({
        code: 500,
        message: '文件下载失败',
        error: error.message
      });
    }
  });

  // 超时取消测试
  router.get('/test-timeout', (req, res) => {
    const delay = parseInt(req.query.delay) || 5000; // 默认延迟5秒
    console.log(`Starting timeout test with ${delay}ms delay`);

    // 检测客户端断开连接
    req.on('close', () => {
      console.log('Client closed connection');
    });

    setTimeout(() => {
      // 检查连接是否已经关闭
      if (!res.writableEnded) {
        res.json({
          code: 200,
          data: {
            message: `请求完成，延迟${delay}ms`,
            time: new Date().toISOString()
          }
        });
      }
    }, delay);
  });

  return router;
}; 