import dotenv from 'dotenv';
import express from 'express';
import { Server } from "socket.io";

import http from 'http';

dotenv.config();

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_ORIGIN,
    methods: ['GET', 'POST'],
  },
});

io.on("connection", (socket) => {
  console.log("A user connected");
  io.emit("ON_USERS", { users: 123 });
  socket.on("disconnect", () => {
    console.log("A user disconnected");
  });
});

const PORT = Number(process.env.PORT || 3002);

server.listen(PORT, () => {
  console.log(`Front-End origin ${process.env.FRONTEND_ORIGIN}`);
  console.log(`Server running at port ${PORT}`);
});