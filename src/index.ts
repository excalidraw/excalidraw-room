require("dotenv").config(
  process.env.NODE_ENV !== "development"
    ? { path: ".env.production" }
    : { path: ".env.development" },
);

import debug from "debug";
import express from "express";
import http from "http";
import { Server } from "socket.io";

const serverDebug = debug("server");
const ioDebug = debug("io");
const socketDebug = debug("socket");

const app = express();
const port = process.env.PORT || 80; // default port to listen

app.use(express.static("public"));

app.get("/", (req, res) => {
  res.send("Excalidraw collaboration server is up :)");
});

const server = http.createServer(app);

server.listen(port, () => {
  serverDebug(`listening on port: ${port}`);
});

const io = new Server(server);

io.on("connection", (socket) => {
  ioDebug("connection established!");

  io.to(`${socket.id}`).emit("init-room");

  socket.on("join-room", (roomID) => {
    socketDebug(`${socket.id} has joined ${roomID}`);

    socket.join(roomID);
    socket.volatile.broadcast.to(roomID).emit("new-user", socket.id);
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
    // const rooms = io.sockets.adapter.rooms;

    for (const roomID in socket.rooms) {
      // const clients = Object.keys(rooms[roomID].sockets).filter(
      //   (id) => id !== socket.id,
      // );
      // if (clients.length > 0) {
      //   socket.broadcast.to(roomID).emit("room-user-change", clients);
      // }
      socket.leave(roomID);
    }
  });

  socket.on("disconnect", () => {
    socket.removeAllListeners();
  });
});
