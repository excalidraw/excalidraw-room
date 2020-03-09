// source: https://github.com/idlewinn/collab-server/blob/master/src/index.ts

import express from 'express';
import http from 'http';
import socketIO from 'socket.io';

const app = express();
const port = process.env.PORT || 8080; // default port to listen

app.get('/', (req, res) => {
  res.send('Hi, there!');
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
      io.to(`${socket.id}`).emit('new-user-first-in-room');
    } else {
      socket.broadcast.to(roomID).emit('new-user', socket.id);
    }
    io.in(roomID).emit(
      'room-user-count',
      io.sockets.adapter.rooms[roomID].length,
    );
  });
  socket.on(
    'new-user-send-update',
    (socketID: string, encryptedData: ArrayBuffer) => {
      console.log(`sending new user update to ${socketID}`);
      io.to(`${socketID}`).emit('new-user-receive-update', encryptedData);
    },
  );
  socket.on('send-update', (roomID, encryptedData) => {
    console.log(`${socket.id} sends update to ${roomID}`);
    socket.broadcast.to(roomID).emit('receive-update', encryptedData);
  });
  socket.on('send-mouse-location', (roomID, pointerCoords) => {
    console.log(`${socket.id} sends mouse update to ${roomID}`);
    socket.broadcast
      .to(roomID)
      .emit('receive-mouse-location', socket.id, pointerCoords);
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
