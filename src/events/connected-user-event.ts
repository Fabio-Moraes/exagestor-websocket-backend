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
            io.to(socket.id).emit('SESSION_CONFLICT_DETECTED')//FRONT-END
        } else {
            connectedUsers.push({
                userid: data.id,
                username: data.name,
                role: data.role,
                status: data.status,
                socket_id: socket.id
            })
            io.emit('SEND_CONNECTED_USER', connectedUsers);
            console.log('A user connected: ', connectedUsers, '\n');
        }
    });

    socket.on('SESSION_CONFLICT_REMOVE', (data) => {
        console.log(data)
        for (const user of connectedUsers) {
            if (user.userid === data.id && user.socket_id !== socket.id) {
                io.to(user.socket_id).emit(`LOGOUT_USER:${user.userid}`);
                removeUser();
            }
        }

        const existingSocketId = connectedUsers.find(user => user.socket_id === socket.id);

        if (!existingSocketId) {
            connectedUsers.push({
                userid: data.id,
                username: data.name,
                role: data.role,
                status: data.status,
                socket_id: socket.id
            })
            io.emit('SEND_CONNECTED_USER', connectedUsers);
            console.log('A user connected: ', connectedUsers, '\n');
        }
    });

    socket.on('LOGOUT_USER' , (data) => {
        const { employee_id } = JSON.parse(data);
        io.emit(`LOGOUT_USER:${employee_id}`);
    });

    socket.on('DISCONNECTED_USER', (data) => {
        socket.disconnect();
        io.emit('SEND_CONNECTED_USER', connectedUsers);
    });

    socket.on('disconnect', () => {
        removeUser();
        io.emit('SEND_CONNECTED_USER', connectedUsers); //FRONT-END
    });
}