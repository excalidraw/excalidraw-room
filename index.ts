// source: https://github.com/idlewinn/collab-server/blob/master/src/index.ts

import express from 'express';
import http from 'http';
import socketIO from 'socket.io';

const app = express();
const port = process.env.PORT || 8080; 

app.get('/', (req, res) => {
  res.send('Hi, collab!');
});

const server = http.createServer(app);

server.listen(port, () => {
  console.log(`listening on port: ${port}`);
});

const io = socketIO(server, {
  handlePreflightRequest: function(req, res) {
    var headers = {
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Allow-Origin': req.header ? req.header.origin : '*',
      'Access-Control-Allow-Credentials': true,
    };
    res.writeHead(200, headers);
    res.end();
  },
});

io.on('connection', socket => {
  console.log('connection established!');
  io.to(`${socket.id}`).emit('init-room');
  socket.on('join-room', roomID => {
    console.log(`${socket.id} has joined ${roomID}`);
    socket.join(roomID);
    if (io.sockets.adapter.rooms[roomID].length <= 1) {
      io.to(`${socket.id}`).emit('first-in-room');
    } else {
      socket.broadcast.to(roomID).emit('new-user', socket.id);
    }
    io.in(roomID).emit(
      'room-user-count',
      io.sockets.adapter.rooms[roomID].length,
    );
  });

  socket.on('server-broadcast', (roomID: string, encryptedData: ArrayBuffer, iv: Uint8Array) => {
    console.log(`${socket.id} sends update to ${roomID}`);
    socket.broadcast.to(roomID).emit('client-broadcast', encryptedData, iv);
  });

  socket.on('disconnecting', () => {
    const rooms = io.sockets.adapter.rooms;
    for (const roomID in socket.rooms) {
      const remaining = rooms[roomID].length - 1;
      if (remaining > 0) {
        socket.broadcast.to(roomID).emit('room-user-count', remaining);
      }
    }
  });

  socket.on('disconnect', () => {
    socket.removeAllListeners();
  });
});
