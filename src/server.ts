import dotenv from 'dotenv';
import { Server, Socket } from "socket.io";
import http from 'http';

dotenv.config();

const httpServer = http.createServer();

const allowedOrigins = [
  process.env.FRONTEND_ORIGIN_BASEURL,
  process.env.BACKEND_ORIGIN_BASEURL
];

const io = new Server(httpServer, {
  cors: {
    origin: (origin, callback) => {
      console.log('######', origin)
      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
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
  console.log(`Server running at port ${PORT}`);
});