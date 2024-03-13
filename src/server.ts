import dotenv from 'dotenv';
import { Server, Socket } from 'socket.io';
import http from 'http';
//import jwt, { TokenExpiredError } from 'jsonwebtoken';
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
  userid: string;
  socket_id: string;
  username: string;
  status: 'online' | 'hidden';
  role: string;
}

const connectedUsers: ConnectedUsers[] = [];

io.on('connection', (socket: Socket) => {
  //const cookies = cookie.parse(socket.handshake.headers.cookie || '');
  //jwt.verify(cookies.auth_token, JWT_SECRET_KEY, { algorithms: ['HS256'] });
  //console.log('Token: ', cookies.auth_token.length ? 'true' : 'false');
  
  const { id: idSocket } = socket.handshake.query as { id: string; name: string; role: string; };

  console.log('A user connected');

  socket.on('CONNECTED_USER', (data) => {
    const userInRoom = connectedUsers.find(user => user.userid === data.id);

    if (userInRoom) {
      userInRoom.socket_id = socket.id
    } else {
      connectedUsers.push({
        userid: data.id,
        username: data.name,
        role: data.role,
        status: data.status,
        socket_id: socket.id
      })
    }

    console.log('Logs:', connectedUsers.length, '\n')
    io.emit('SEND_CONNECTED_USER', connectedUsers);
  });

  socket.on('FETCH_CONNECTED_USER', (data) => {
    io.emit('SEND_CONNECTED_USER', connectedUsers);
  });

  socket.on('HIDDEN_USER', (data) => {
    for (let i = 0; i < connectedUsers.length; i++) {
      if (connectedUsers[i].userid === data.id) {
        connectedUsers[i].status = data.hidden ? 'hidden' : 'online';
      }
    }
    io.emit('SEND_CONNECTED_USER', connectedUsers);
  });

  socket.on('DISCONNECTED_USER', (data) => {
    socket.disconnect();
    io.emit('SEND_CONNECTED_USER', connectedUsers);
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

  socket.on('disconnect', () => {
    console.log('A user disconnected', '\n', 'ID:', idSocket, '\n');

    const index = connectedUsers.findIndex(user => user.socket_id === socket.id);
    if (index !== -1) {
      connectedUsers.splice(index, 1);
      io.emit('SEND_CONNECTED_USER', connectedUsers);
    }
  });
});

const PORT = Number(process.env.PORT);

httpServer.listen(PORT, () => {
  console.log(`Server running at port ${PORT}`);
});
