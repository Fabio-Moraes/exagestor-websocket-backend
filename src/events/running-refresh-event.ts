import { Socket } from "socket.io";
import { io } from '../server';

export default function handleRunningRefreshEvent(socket: Socket) {
  socket.on('RUNNING_REFRESH', (data) => {
    const { employee_id } = JSON.parse(data);
    io.emit(`RUNNING_REFRESH_TEC:${employee_id}`);
    io.emit('RUNNING_REFRESH_ADMIN');
    socket.disconnect();
  });

  /* socket.on('RUNNING_REFRESH_CLASS_L', (data) => {
    const { protocol } = JSON.parse(data);
    io.emit(`RUNNING_REFRESH_CLASS_L:${protocol}`);
    socket.disconnect();
  }); */
}
