require('dotenv').config();

const http = require('http');
const app = require('./src/app');
const { iniciarSockets } = require('./src/sockets');

const PORT = process.env.PORT || 3000;

const server = http.createServer(app);
iniciarSockets(server);

server.listen(PORT, () => {
  console.log(`Servidor ejecutándose en http://localhost:${PORT}`);
});