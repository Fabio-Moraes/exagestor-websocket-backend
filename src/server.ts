import dotenv from 'dotenv';
import { Server, Socket } from 'socket.io';
//import jwt, { TokenExpiredError } from 'jsonwebtoken';
import http from 'http';
//import cookie from 'cookie';

dotenv.config();

const httpServer = http.createServer();
//const JWT_SECRET_KEY = '202b5105-39a4-4fd9-9d9e-d17542d05994';

const allowedOrigins = [
  process.env.FRONTEND_ORIGIN_BASEURL,
  process.env.BACKEND_ORIGIN_BASEURL
];

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

interface ConnectedUsers {
  [key: string]: {
    id: number;
    name: string;
    online: boolean;
    role: string;
  }
}

let connectedUsers = {} as ConnectedUsers;

io.on('connection', (socket: Socket) => {
  try {
    //const cookies = cookie.parse(socket.handshake.headers.cookie || '');
    //jwt.verify(cookies.auth_token, JWT_SECRET_KEY, { algorithms: ['HS256'] });
    //console.log('Token: ', cookies.auth_token.length ? 'true' : 'false');

    console.log('A user connected');

    socket.on('INCLUDE_CONNECTED_USER', (data) => {
      const { id, name, role } = JSON.parse(data);
      connectedUsers[socket.id] = { online: true, id, name, role };
      io.emit('SEND_CONNECTED_USER', JSON.stringify(connectedUsers));
    });

    socket.on('FETCH_CONNECTED_USER', (data) => {
      io.emit('SEND_CONNECTED_USER', JSON.stringify(connectedUsers));
    });

    socket.on('RUNNING_REFRESH', (data) => {
      const { employee_id } = JSON.parse(data);
      io.emit(`RUNNING_REFRESH_TEC:${employee_id}`, JSON.stringify({ employee_id: employee_id }));
      io.emit('RUNNING_REFRESH_ADMIN', JSON.stringify({ employee_id: employee_id }));
    });

    socket.on('STOCK_REFRESH', (data) => {
      const { employee_id } = JSON.parse(data);
      io.emit(`STOCK_REFRESH_TEC:${employee_id}`, JSON.stringify({ employee_id: employee_id }));
      io.emit('STOCK_REFRESH_ALMOX', JSON.stringify({ employee_id: employee_id }));
    });

    socket.on('FETCH_DISCONNECT_USER', (data) => {
      const { id } = JSON.parse(data);
      console.log('Desconectou', id)

      for (const key of Object.keys(connectedUsers)) {
        if (connectedUsers[key].id === Number(id)) {
          delete connectedUsers[key];
        }
      }

      io.emit('SEND_CONNECTED_USER', JSON.stringify(connectedUsers));
    })

    socket.on('disconnect', () => {
      console.log('A user disconnected');
      delete connectedUsers[socket.id];
      io.emit('SEND_CONNECTED_USER', JSON.stringify(connectedUsers));
    });

  } catch (error) {
    // if (error instanceof TokenExpiredError) {
    //   console.log('Token expired');
    // } else {
    //   console.log('Invalid token');
    // }
  }
});

const PORT = Number(process.env.PORT);

httpServer.listen(PORT, () => {
  console.log(`Server running at port ${PORT}`);
});
