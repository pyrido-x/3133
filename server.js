const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http, {
  cors: {
    origin: "*", // 允许跨网络、跨设备访问
    methods: ["GET", "POST"]
  }
});
const path = require('path');

// 🌟 1. 静态文件服务：精准交出 index.html
app.use(express.static(path.join(__dirname, '/')));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// 🌟 2. 核心联机逻辑：房间与数据状态管理
const rooms = {};

io.on('connection', (socket) => {
    console.log('新玩家已连接，网络ID:', socket.id);

    // 玩家请求加入房间
    socket.on('join_room', (roomCode) => {
        // 如果房间不存在，先建个空房间
        if (!rooms[roomCode]) {
            rooms[roomCode] = { players: [] };
        }

        const room = rooms[roomCode];

        // 房间人数已满（双人对战限制）
        if (room.players.length >= 2) {
            socket.emit('room_full', '⚠️ 该房间人数已满，请更换其他房间码。');
            return;
        }

        // 登记玩家并加入 Socket 房间
        room.players.push(socket.id);
        socket.join(roomCode);

        // 分配身份
        if (room.players.length === 1) {
            // 第一个人进房，成为先手（红方），等待中
            socket.emit('joined', { msg: '房间创建成功，等待对手加入...' });
        } else if (room.players.length === 2) {
            // 第二个人进房，游戏正式开始
            socket.emit('joined', { msg: '对手已就位，游戏开始！' });
            
            // 广播分配身份角色（role 1 为先手，role 2 为后手）
            io.to(room.players[0]).emit('start_game', { role: 1 });
            io.to(room.players[1]).emit('start_game', { role: 2 });
        }
    });

    // 接收一端的操作数据，立刻原样转发给同一房间的对手
    socket.on('sync_state', (data) => {
        // socket.to() 确保数据只会发给同房间的对手，不会发回给自己，也不会串台
        socket.to(data.roomCode).emit('state_updated', data.gameState);
    });

    // 处理玩家意外掉线、刷新页面或强退
    socket.on('disconnect', () => {
        console.log('玩家断开连接:', socket.id);
        
        // 遍历所有房间，揪出掉线的人
        for (const roomCode in rooms) {
            const room = rooms[roomCode];
            const playerIndex = room.players.indexOf(socket.id);
            
            if (playerIndex !== -1) {
                // 把掉线玩家踢出房间名单
                room.players.splice(playerIndex, 1);
                
                // 通知房间里的另一个人：你对手跑了
                io.to(roomCode).emit('opponent_disconnected', '⚠️ 对手已断开连接，对局强制结束。');
                
                // 彻底销毁空房间，释放服务器内存
                if (room.players.length === 0) {
                    delete rooms[roomCode];
                }
                break;
            }
        }
    });
});

// 🌟 3. 动态端口分配：Render 纯云端的硬性要求
const PORT = process.env.PORT || 3000;
http.listen(PORT, () => {
    console.log(`🚀 游戏服务器已在全球公网完美启动，正在监听端口: ${PORT}`);
});
