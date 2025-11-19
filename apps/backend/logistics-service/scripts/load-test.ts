import { io } from 'socket.io-client';

const NUM_DRIVERS = 100;
const INTERVAL_MS = 5000;
const URL = 'http://localhost:3000'; // Assuming default NestJS port

interface DriverSocket {
  id: string;
  socket: ReturnType<typeof io>;
}

const drivers: DriverSocket[] = [];

console.log(`Starting load test with ${NUM_DRIVERS} drivers...`);

for (let i = 0; i < NUM_DRIVERS; i++) {
  const driverId = `driver-${i}`;
  const socket = io(URL);

  socket.on('connect', () => {
    // console.log(`${driverId} connected`);
  });

  socket.on('disconnect', () => {
    console.log(`${driverId} disconnected`);
  });

  drivers.push({ id: driverId, socket });
}

setInterval(() => {
  console.log(`Sending updates for ${NUM_DRIVERS} drivers...`);
  drivers.forEach(({ id, socket }) => {
    if (socket.connected) {
      const lat = -34.6037 + (Math.random() - 0.5) * 0.1; // Around Buenos Aires
      const lng = -58.3816 + (Math.random() - 0.5) * 0.1;

      socket.emit('updateLocation', {
        driverId: id,
        lat,
        lng,
      });
    }
  });
}, INTERVAL_MS);

// Handle exit
process.on('SIGINT', () => {
  console.log('Stopping load test...');
  drivers.forEach(({ socket }) => socket.disconnect());
  process.exit();
});
