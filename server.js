const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static(__dirname));

let rooms = {}; // 存储所有房间的状态

io.on("connection", (socket) => {
  // 玩家输入房间码加入
  socket.on("join_room", (roomCode) => {
    if (!rooms[roomCode]) {
      // 房间不存在，创建房间，当前玩家作为第一个等待者
      rooms[roomCode] = { players: [socket.id], state: null };
      socket.join(roomCode);
      socket.emit("joined", { msg: "房间创建成功！正在等待对手输入相同房间码加入..." });
    } else if (rooms[roomCode].players.length === 1) {
      // 房间有一个人，第二个人加入，人满开局
      rooms[roomCode].players.push(socket.id);
      socket.join(roomCode);
      
      // 【核心功能】系统随机指派先后手
      const p1Index = Math.random() < 0.5 ? 0 : 1;
      const p2Index = p1Index === 0 ? 1 : 0;
      
      const p1Socket = rooms[roomCode].players[p1Index];
      const p2Socket = rooms[roomCode].players[p2Index];
      
      // 分别通知两位玩家他们的身份（1是先手红，2是后手蓝）
      io.to(p1Socket).emit("start_game", { role: 1 }); 
      io.to(p2Socket).emit("start_game", { role: 2 }); 
    } else {
      socket.emit("room_full", "该房间人数已满，请更换房间码！");
    }
  });

  // 接收某一方的操作状态并广播给房间内的另一方
  socket.on("sync_state", (data) => {
    if (rooms[data.roomCode]) {
      rooms[data.roomCode].state = data.gameState;
      socket.to(data.roomCode).emit("state_updated", data.gameState);
    }
  });

  // 断开连接处理
  socket.on("disconnect", () => {
    for (let code in rooms) {
      if (rooms[code].players.includes(socket.id)) {
        io.to(code).emit("opponent_disconnected", "对手离开了对局，游戏结束。");
        delete rooms[code];
      }
    }
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`游戏服务已启动，端口: ${PORT}`);
});
