import dotenv from 'dotenv';
import { Server, Socket } from "socket.io";
import jwt, { TokenExpiredError } from 'jsonwebtoken';
import http from 'http';

dotenv.config();

interface Decoded {
  user: {
    id: number;
    name: string;
    role: string;
  };
}

const httpServer = http.createServer();

const allowedOrigins = [
  process.env.FRONTEND_ORIGIN_BASEURL,
  process.env.BACKEND_ORIGIN_BASEURL
];

const JWT_SECRET_KEY = '202b5105-39a4-4fd9-9d9e-d17542d05994';

const io = new Server(httpServer, {
  cors: {
    origin: (origin, callback) => {
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
  const token = socket.handshake.auth.token as string;

  jwt.verify(token, JWT_SECRET_KEY, async (error, decoded) => {
    const { user: employee } = decoded as Decoded;

    if (error) {
      if (error instanceof TokenExpiredError) {
        console.log('** verify token expired **')
        return;
      } else {
        console.log('** verify token inválido **')
        return;
      }
    }

    console.log("A user connected");
    
    socket.on('RUNNING_UPDATE_TEC', (data) => {
      const { employee_id } = JSON.parse(data)

      io.emit(`RUNNING_UPDATE_TEC:${employee_id}`, JSON.stringify({ employee_id: employee_id }));
      io.emit('RUNNING_UPDATE_ADMIN', JSON.stringify({ employee_id: employee_id }));
    });


    socket.on("disconnect", () => {
      console.log("A user disconnected");
    });
  });
});

const PORT = Number(process.env.PORT);

httpServer.listen(PORT, () => {
  console.log(`Server running at port ${PORT}`);
});