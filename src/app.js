const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const http = require('http');
const WebSocket = require('ws');
const { Server } = require('socket.io');
require('dotenv').config();

const errorHandler = require('./middleware/errorHandler');
const routes = require('./routes');
const db = require('./models');
const userRoutes = require('./routes/user.routes');

const app = express();
const server = http.createServer(app);

// WebSocket setup
const wss = new WebSocket.Server({ 
  server,
  path: '/ws'
});

// Socket.IO setup
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"]
  },
  path: '/socket.io'
});

// Export instances for use in routes
app.set('io', io);
app.set('wss', wss);

// 中间件
app.use(cors({
  origin: 'http://localhost:5173',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

app.use(helmet({
  contentSecurityPolicy: false
}));
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 静态文件服务
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// WebSocket 基本事件处理
wss.on('connection', (ws) => {
  console.log('WebSocket client connected');

  ws.on('message', (message) => {
    try {
      // 处理心跳消息
      if (message.toString() === 'ping') {
        ws.send('pong');
        return;
      }

      const data = JSON.parse(message);
      console.log('Received:', data);

      // 广播消息给其他客户端
      wss.clients.forEach((client) => {
        if (client !== ws && client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify({
            type: 'message',
            content: data.content,
            timestamp: new Date().toISOString()
          }));
        }
      });
    } catch (error) {
      console.error('WebSocket error:', error);
      ws.send(JSON.stringify({ type: 'error', message: 'Failed to process message' }));
    }
  });

  ws.on('close', () => {
    console.log('Client disconnected');
  });

  // 发送欢迎消息
  ws.send(JSON.stringify({
    type: 'system',
    message: 'Welcome to WebSocket server',
    timestamp: new Date().toISOString()
  }));
});

// 路由
app.use('/api', routes(app));
app.use('/api/users', userRoutes);

// 添加错误处理中间件
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({
    success: false,
    message: err.message || '服务器错误'
  });
});

// 404 处理
app.use((req, res) => {
  res.status(404).json({
    code: 404,
    message: '接口不存在'
  });
});

// 启动服务器
const PORT = process.env.PORT || 3000;

// 临时使用 force 选项重建表
db.sequelize.sync({ force: true })
  .then(() => {
    console.log('Database synced');
    server.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
      console.log(`WebSocket server is running on ws://localhost:${PORT}/ws`);
      console.log(`Socket.IO server is running on ws://localhost:${PORT}/socket.io`);
    });
  })
  .catch(err => {
    console.error('Unable to sync database:', err);
  });

module.exports = app; 