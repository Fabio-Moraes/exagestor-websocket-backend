import dotenv from 'dotenv';
import { Server, Socket } from 'socket.io';
import jwt, { TokenExpiredError } from 'jsonwebtoken';
import http from 'http';
import cookie from 'cookie';

dotenv.config();

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
  maxHttpBufferSize: 1e8,
  transports: ['websocket'],
  allowUpgrades: false,
});

io.on('connection', (socket: Socket) => {
  try {
    const cookies = cookie.parse(socket.handshake.headers.cookie || '');
    jwt.verify(cookies.auth_token, JWT_SECRET_KEY, { algorithms: ['HS256'] });

    console.log('Token', cookies.auth_token.length ? '✅' : '❌');
    console.log('A user connected');

    socket.on('RUNNING_REFRESH', (data) => {
      const { employee_id } = JSON.parse(data)
      io.emit(`RUNNING_REFRESH_TEC:${employee_id}`, JSON.stringify({ employee_id: employee_id }));
      io.emit('RUNNING_REFRESH_ADMIN', JSON.stringify({ employee_id: employee_id }));
    });

    socket.on('STOCK_REFRESH', (data) => {
      const { employee_id } = JSON.parse(data)
      io.emit(`STOCK_REFRESH_TEC:${employee_id}`, JSON.stringify({ employee_id: employee_id }));
      io.emit('STOCK_REFRESH_ALMOX', JSON.stringify({ employee_id: employee_id }));
    });

    socket.on('disconnect', () => {
      console.log('A user disconnected');
    });
  } catch (error) {
    if (error instanceof TokenExpiredError) {
      console.log('Token expired');
    } else {
      console.log('Invalid token');
    }
  }
});
const PORT = Number(process.env.PORT);

httpServer.listen(PORT, () => {
  console.log(`Server running at port ${PORT}`);
});