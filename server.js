const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});
const path = require('path');

// 🌟🌟🌟【关键修复：告诉服务器前端网页就在当前目录】🌟🌟🌟
app.use(express.static(path.join(__dirname, '/')));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// 房间和游戏逻辑数据
const rooms = {};

io.on('connection', (socket) => {
    // 你原本的 socket.io 联机逻辑代码...
    // （这里保持你原本的 io.on 内部逻辑不动即可）
});

// 🌟🌟🌟【关键修复：不要用固定端口，优先读取云平台分配的端口】🌟🌟🌟
const PORT = process.env.PORT || 3000;
http.listen(PORT, () => {
    console.log(`游戏服务器已在全球公网启动，端口: ${PORT}`);
});
