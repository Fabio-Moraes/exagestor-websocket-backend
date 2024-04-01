import { Socket } from "socket.io";
import { connectedUsers, io } from '../server';

export default function handleConnectedUserEvent(socket: Socket) {
    const removeUser = () => {
        const index = connectedUsers.findIndex(user => user.socket_id === socket.id);
        if (index !== -1) { connectedUsers.splice(index, 1) }
    }

    socket.on('CONNECTED_USER', (data) => {
        const existingUserId = connectedUsers.find(user => user.userid === data.id);

        if (existingUserId) {
            io.to(socket.id).emit('SESSION_CONFLICT_DETECTED')
        } else {
            connectedUsers.push({
                userid: data.id,
                username: data.name,
                role: data.role,
                status: data.hidden ? 'hidden' : 'online',
                socket_id: socket.id
            })
            console.log('A user connected: ', connectedUsers, '\n');
            io.emit('ALL_CONNECTED_USER', connectedUsers);
        }
    });

    socket.on('GET_CONNECTED_USER', (data) => {
        io.emit('ALL_CONNECTED_USER', connectedUsers);
    });

    socket.on('SESSION_CONFLICT_DISCONNECT', (data) => {
        const jsonObj = JSON.stringify({ role: 'myself' })
        for (const user of connectedUsers) {
            if (user.userid === data.id && user.socket_id !== socket.id) {
                io.to(user.socket_id).emit(`REMOTE_LOGOUT_USER:${user.userid}`, jsonObj);
                removeUser();
            }
        }

        const existingSocketId = connectedUsers.find(user => user.socket_id === socket.id);

        if (!existingSocketId) {
            connectedUsers.push({
                userid: data.id,
                username: data.name,
                role: data.role,
                status: data.hidden ? 'hidden' : 'online',
                socket_id: socket.id
            })
            io.emit('ALL_CONNECTED_USER', connectedUsers);
            console.log('A user connected: ', connectedUsers, '\n');
        }
    });

    socket.on('REMOTE_LOGOUT_USER', (data) => {
        const { employee_id } = JSON.parse(data);
        const jsonObj = JSON.stringify({ role: 'admin' })
        io.emit(`REMOTE_LOGOUT_USER:${employee_id}`, jsonObj);
    });

    socket.on('disconnect', () => {
        console.log(`${socket.id} - desconectou`)
        removeUser();
        io.emit('ALL_CONNECTED_USER', connectedUsers);
    });
}