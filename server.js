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

// 1. 让服务器能够正确交出同目录下的 index.html 网页
app.use(express.static(path.join(__dirname, '/')));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// 2. 这里塞入你原本的 房间数据 和 socket.io 联机逻辑
const rooms = {};

io.on('connection', (socket) => {
    console.log('有玩家连接进来了：', socket.id);
    
    // 把你原本处理房间（create-room, join-room, move）的 io.on 逻辑原封不动贴在这里
    // ...
});

// 3. 🌟 核心：Render 免费版必须动态读取端口，不能写死成 3000 
const PORT = process.env.PORT || 3000;
http.listen(PORT, () => {
    console.log(`游戏服务器已在全球公网启动，端口: ${PORT}`);
});
