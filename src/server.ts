import dotenv from 'dotenv';
import { Server, Socket } from 'socket.io';
import http from 'http';

import handleConnectedUserEvent from './events/connected-user-event';
import handleApplicationInactiveEvent from './events/application-inactive-event';
import handleRunningRefreshEvent from './events/running-refresh-event';

//import jwt, { TokenExpiredError } from 'jsonwebtoken';
//import cookie from 'cookie';

//const JWT_SECRET_KEY = '202b5105-39a4-4fd9-9d9e-d17542d05994';
//const cookies = cookie.parse(socket.handshake.headers.cookie || '');
//jwt.verify(cookies.auth_token, JWT_SECRET_KEY, { algorithms: ['HS256'] });
//console.log('Token: ', cookies.auth_token.length ? 'true' : 'false');
//const { id: idSocket } = socket.handshake.query as { id: string; name: string; role: string; };

dotenv.config();

const httpServer = http.createServer((request, response) => {
  response.end(`handled by pid: ${process.pid}`)
});

const allowedOrigins = [
  process.env.FRONTEND_ORIGIN_BASEURL,
  process.env.BACKEND_ORIGIN_BASEURL
];

export const io = new Server(httpServer, {
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

interface ConnectedUsers {
  userid: string;
  socket_id: string;
  username: string;
  status: 'online' | 'hidden';
  role: string;
}

export const connectedUsers: ConnectedUsers[] = [];

io.on('connection', (socket: Socket) => {
  handleConnectedUserEvent(socket);
  handleApplicationInactiveEvent(socket);
  handleRunningRefreshEvent(socket);
});

const PORT = Number(process.env.PORT);

httpServer.listen(PORT, () => {
  console.log(`Server running at port: ${PORT} | pid: ${process.pid} \n`);
});
