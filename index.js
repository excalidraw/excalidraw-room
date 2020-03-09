"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var express_1 = __importDefault(require("express"));
var https_1 = __importDefault(require("https"));
var socket_io_1 = __importDefault(require("socket.io"));
var app = express_1.default();
var port = process.env.PORT || 80; // default port to listen
var server = https_1.default.createServer(app);
server.listen(port, function () {
    console.log("listening on port: " + port);
});
var io = socket_io_1.default(server, {
    handlePreflightRequest: function (req, res) {
        var headers = {
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
            'Access-Control-Allow-Origin': req.header ? req.header.origin : '*',
            'Access-Control-Allow-Credentials': true,
        };
        res.writeHead(200, headers);
        res.end();
    },
});
io.on('connection', function (socket) {
    console.log('connection established!');
    io.to("" + socket.id).emit('init-room');
    socket.on('join-room', function (roomID) {
        console.log(socket.id + " has joined " + roomID);
        socket.join(roomID);
        if (io.sockets.adapter.rooms[roomID].length <= 1) {
            io.to("" + socket.id).emit('new-user-first-in-room');
        }
        else {
            socket.broadcast.to(roomID).emit('new-user', socket.id);
        }
        io.in(roomID).emit('room-user-count', io.sockets.adapter.rooms[roomID].length);
    });
    socket.on('new-user-send-update', function (socketID, encryptedData) {
        console.log("sending new user update to " + socketID);
        io.to("" + socketID).emit('new-user-receive-update', encryptedData);
    });
    socket.on('send-update', function (roomID, encryptedData) {
        console.log(socket.id + " sends update to " + roomID);
        socket.broadcast.to(roomID).emit('receive-update', encryptedData);
    });
    socket.on('send-mouse-location', function (roomID, pointerCoords) {
        console.log(socket.id + " sends mouse update to " + roomID);
        socket.broadcast
            .to(roomID)
            .emit('receive-mouse-location', socket.id, pointerCoords);
    });
    socket.on('disconnecting', function () {
        var rooms = io.sockets.adapter.rooms;
        for (var roomID in socket.rooms) {
            var remaining = rooms[roomID].length - 1;
            if (remaining > 0) {
                socket.broadcast.to(roomID).emit('room-user-count', remaining);
            }
        }
    });
    socket.on('disconnect', function () {
        socket.removeAllListeners();
    });
});
