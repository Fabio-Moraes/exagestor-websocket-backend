import dotenv from 'dotenv';
import { Server, Socket } from "socket.io";
import express from 'express';

import http from 'http';

dotenv.config();

const app = express();

app.get("/", (req, res) => {
  res.status(200).send({
    success: true,
    message: "welcome to the beginning of greatness",
  });
});

const httpServer = http.createServer();

const io = new Server(httpServer, {
  cors: {
    origin: 'https://exatelecom.vercel.app',
    methods: ['GET', 'POST'],
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