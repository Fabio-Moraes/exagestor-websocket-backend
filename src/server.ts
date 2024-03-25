import dotenv from 'dotenv';
import { Server, Socket } from 'socket.io';
import http from 'http';
//import jwt, { TokenExpiredError } from 'jsonwebtoken';
//import cookie from 'cookie';
//const JWT_SECRET_KEY = '202b5105-39a4-4fd9-9d9e-d17542d05994';

dotenv.config();

const httpServer = http.createServer();

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
  //const { id: idSocket } = socket.handshake.query as { id: string; name: string; role: string; };

  const removeUser = () => {
    const index = connectedUsers.findIndex(user => user.socket_id === socket.id);
    if (index !== -1) { connectedUsers.splice(index, 1) }
  }

  socket.on('CONNECTED_USER' /* FRONT-END | BACK-END */, (data) => {
    const addUser = () => {
      connectedUsers.push({
        userid: data.id,
        username: data.name,
        role: data.role,
        status: data.status,
        socket_id: socket.id
      })
    }

    const existingUserId = connectedUsers.find(user => user.userid === data.id);

    if (existingUserId) {
      for (const user of connectedUsers) {
        if (user.userid === data.id && user.socket_id !== socket.id) {
          removeUser();
          io.to(user.socket_id).emit(`LOGOUT_USER:${user.userid}`); //FRONT-END
        }
      }

      const existingSocketId = connectedUsers.find(user => user.socket_id === data.id);
      if (!existingSocketId) addUser();
    } else {
      addUser();
    }

    io.emit('SEND_CONNECTED_USER', connectedUsers); //FRONT-END
    console.log('A user connected: ', connectedUsers, '\n');
  });

  socket.on('HIDDEN_USER' /* FRONT-END */, (data) => {
    for (let i = 0; i < connectedUsers.length; i++) {
      if (connectedUsers[i].userid === data.id) {
        connectedUsers[i].status = data.hidden ? 'hidden' : 'online';
      }
    }
    io.emit('SEND_CONNECTED_USER', connectedUsers); //FRONT-END
  });

  socket.on('DISCONNECTED_USER' /* FRONT-END */, (data) => {
    socket.disconnect();
    io.emit('SEND_CONNECTED_USER', connectedUsers); //FRONT-END
  });

  socket.on('RUNNING_REFRESH' /* BACK-END */, (data) => {
    const { employee_id } = JSON.parse(data);
    io.emit(`RUNNING_REFRESH_TEC:${employee_id}`); //FRONT-END
    io.emit('RUNNING_REFRESH_ADMIN'); //FRONT-END
    socket.disconnect();
  });

  socket.on('LOGOUT_USER' /* FRONT-END */, (data) => {
    const { employee_id } = JSON.parse(data);
    io.emit(`LOGOUT_USER:${employee_id}`); //FRONT-END
  });

  socket.on('disconnect', () => {
    removeUser();
    io.emit('SEND_CONNECTED_USER', connectedUsers); //FRONT-END
  });
});

const PORT = Number(process.env.PORT);

httpServer.listen(PORT, () => {
  console.log(`Server running at port ${PORT}`);
});