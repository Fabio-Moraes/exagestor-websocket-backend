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

const appEnv = process.env.APP_ENV === 'production';
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
  cookie: {
    name: 'auth_token',
    path: '/',
    secure: appEnv,
    httpOnly: true,
    ...(appEnv && { sameSite: 'strict' })
  },
  maxHttpBufferSize: 1e8,
  transports: ['websocket'],
  allowUpgrades: false,
});

io.on('connection', (socket: Socket) => {
  const cookies = cookie.parse(socket.handshake.headers.cookie || '');

  console.log('cookie http only: ', cookies)

  jwt.verify(cookies.auth_token, JWT_SECRET_KEY, { algorithms: ['HS256'] }, async (error, decoded) => {
    if (error) {
      if (error instanceof TokenExpiredError) {
        console.log('** verify token expired **')
        return;
      } else {
        console.log('** verify token inválido **')
        return;
      }
    }

    console.log('A user connected');
    
    socket.on('RUNNING_UPDATE', (data) => {
      const { employee_id } = JSON.parse(data)
      console.log(`RUNNING_UPDATE:${employee_id}`);

      io.emit(`RUNNING_UPDATE_TEC:${employee_id}`, JSON.stringify({ employee_id: employee_id }));
      io.emit('RUNNING_UPDATE_ADMIN', JSON.stringify({ employee_id: employee_id }));
    });

    socket.on('disconnect', () => {
      console.log('A user disconnected');
    });
  });
});

const PORT = Number(process.env.PORT);

httpServer.listen(PORT, () => {
  console.log(`Server running at port ${PORT}`);
});