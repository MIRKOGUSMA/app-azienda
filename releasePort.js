const net = require('net');
const server = net.createServer();

server.listen(5001, () => {
  console.log('Porta 5001 rilasciata.');
  server.close();
});

server.on('error', (err) => {
  console.error('Errore:', err);
});
