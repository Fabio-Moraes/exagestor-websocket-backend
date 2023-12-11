import dotenv from 'dotenv';
import express from 'express';
import { Server, Socket } from "socket.io";

import { createServer } from 'http';

dotenv.config();


const httpServer = createServer();

const io = new Server(httpServer, {
  cors: {
    origin: String(process.env.FRONTEND_ORIGIN) || 'http://localhost:3000',
    methods: ['GET', 'POST'],
    credentials: true
  },
});

io.on("connection", (socket: Socket) => {
  console.log("A user connected");
  io.emit("ON_USERS", JSON.stringify({ users: 123 }));
  socket.on("disconnect", () => {
    console.log("A user disconnected");
  });
});

const PORT = Number(process.env.PORT);

httpServer.listen(PORT, () => {
  console.log(`Front-End origin ${process.env.FRONTEND_ORIGIN}`);
  console.log(`Server running at port ${PORT}`);
});