"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.roomHandler = void 0;
const uuid_1 = require("uuid");
const rooms = {};
const chats = {};
const roomHandler = (socket) => {
    const createRoom = () => {
        const roomId = (0, uuid_1.v4)();
        rooms[roomId] = {};
        socket.emit("room-created", { roomId });
        console.log("user created the room");
    };
    const joinRoom = ({ roomId, peerId, userName }) => {
        if (!rooms[roomId])
            rooms[roomId] = {};
        if (!chats[roomId])
            chats[roomId] = [];
        socket.emit("get-messages", chats[roomId]);
        console.log("user joined the room", roomId, peerId, userName);
        rooms[roomId][peerId] = { peerId, userName };
        socket.join(roomId);
        socket.to(roomId).emit("user-joined", { peerId, userName });
        socket.emit("get-users", {
            roomId,
            participants: rooms[roomId],
        });
        socket.on("disconnect", () => {
            console.log("user left the room", peerId);
            leaveRoom({ roomId, peerId });
        });
    };
    const leaveRoom = ({ peerId, roomId }) => {
        // rooms[roomId] = rooms[roomId]?.filter((id) => id !== peerId);
        socket.to(roomId).emit("user-disconnected", peerId);
    };
    const startSharing = ({ peerId, roomId }) => {
        console.log({ roomId, peerId });
        socket.to(roomId).emit("user-started-sharing", peerId);
    };
    const stopSharing = (roomId) => {
        socket.to(roomId).emit("user-stopped-sharing");
    };
    const addMessage = (roomId, message) => {
        console.log({ message });
        if (chats[roomId]) {
            chats[roomId].push(message);
        }
        else {
            chats[roomId] = [message];
        }
        socket.to(roomId).emit("add-message", message);
    };
    const changeName = ({ peerId, userName, roomId, }) => {
        if (rooms[roomId] && rooms[roomId][peerId]) {
            rooms[roomId][peerId].userName = userName;
            socket.to(roomId).emit("name-changed", { peerId, userName });
        }
    };
    socket.on("create-room", createRoom);
    socket.on("join-room", joinRoom);
    socket.on("start-sharing", startSharing);
    socket.on("stop-sharing", stopSharing);
    socket.on("send-message", addMessage);
    socket.on("change-name", changeName);
};
exports.roomHandler = roomHandler;
