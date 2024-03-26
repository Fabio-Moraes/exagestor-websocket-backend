import { Socket } from "socket.io";
import { connectedUsers, io } from '../server';

export default function handleApplicationInactiveEvent(socket: Socket) {
    socket.on('HIDDEN_USER', (data) => {
        for (let i = 0; i < connectedUsers.length; i++) {
          if (connectedUsers[i].userid === data.id) {
            connectedUsers[i].status = data.hidden ? 'hidden' : 'online';
          }
        }
        io.emit('SEND_CONNECTED_USER', connectedUsers); //FRONT-END
      });
}