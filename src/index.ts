import debug from "debug";
import express from "express";
import http from "http";
import socketIO from "socket.io";
// @ts-ignore
import redisAdapter from "socket.io-redis";
// @ts-ignore
import redis from "redis";
import cors from "cors";

const serverDebug = debug("server");
const ioDebug = debug("io");
const socketDebug = debug("socket");

require("dotenv").config(
  process.env.NODE_ENV !== "development"
      ? { path: ".env.production" }
      : { path: ".env.development" },
);

const app = express();
const port = process.env.PORT || 3002; // default port to listen

app.use(cors());
app.use(express.static("public"));

app.get("/", (req, res) => {
  res.send("Excalidraw collaboration server is up :)");
});

app.get("/collab-server", (req, res) => {
  res.json({
    url: process.env.REACT_APP_WS_SERVER_URL,
    polling: false,
  });
});

const server = http.createServer(app);

const io = socketIO(server, {
  handlePreflightRequest: (req, res) => {
    const headers = {
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
      "Access-Control-Allow-Origin":
        (req.header && req.header.origin) || "https://excalidraw.com",
      "Access-Control-Allow-Credentials": true,
    };
    res.writeHead(200, headers);
    res.end();
  },
});

server.listen(port, () => {
  serverDebug(`listening on port: ${port}`);
});

if (process.env.REDIS_HOST && process.env.REDIS_PORT) {
  const pubClient = redis.createClient(
    process.env.REDIS_PORT,
    process.env.REDIS_HOST,
  );
  const subClient = pubClient.duplicate();

  io.adapter(redisAdapter({ pubClient, subClient }));
}

io.on("connection", (socket) => {
  ioDebug("connection established!");
  io.to(`${socket.id}`).emit("init-room");
  socket.on("join-room", (roomID) => {
    socketDebug(`${socket.id} has joined ${roomID}`);
    socket.join(roomID);
    if (io.sockets.adapter.rooms[roomID].length <= 1) {
      io.to(`${socket.id}`).emit("first-in-room");
    } else {
      socket.broadcast.to(roomID).emit("new-user", socket.id);
    }
    io.in(roomID).emit(
      "room-user-change",
      Object.keys(io.sockets.adapter.rooms[roomID].sockets),
    );
  });

  socket.on(
    "server-broadcast",
    (roomID: string, encryptedData: ArrayBuffer, iv: Uint8Array) => {
      socketDebug(`${socket.id} sends update to ${roomID}`);
      socket.broadcast.to(roomID).emit("client-broadcast", encryptedData, iv);
    },
  );

  socket.on(
    "server-volatile-broadcast",
    (roomID: string, encryptedData: ArrayBuffer, iv: Uint8Array) => {
      socketDebug(`${socket.id} sends volatile update to ${roomID}`);
      socket.volatile.broadcast
        .to(roomID)
        .emit("client-broadcast", encryptedData, iv);
    },
  );

  socket.on("disconnecting", () => {
    const rooms = io.sockets.adapter.rooms;
    for (const roomID in socket.rooms) {
      const clients = Object.keys(rooms[roomID].sockets).filter(
        (id) => id !== socket.id,
      );
      if (clients.length > 0) {
        socket.broadcast.to(roomID).emit("room-user-change", clients);
      }
    }
  });

  socket.on("disconnect", () => {
    socket.removeAllListeners();
  });
});
