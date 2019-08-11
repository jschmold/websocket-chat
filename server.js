const WebSocket = require('ws');
const { timer } = require('rxjs');

const server = new WebSocket.Server({ port: 8080 });
const clients = new Map();

let anonymous = 0;

function send(socket, obj) {
  const data = JSON.stringify(obj);
  socket.send(data);
}

function broadcast(obj) {
  for (const client of server.clients) {
    send(client, obj);
  }
}

function chatMessage(message) {
  broadcast({event: 'chat', data: message});
}

function serverMessage(message) {
  broadcast({event: 'chat', data: `Server> ${message}`});
}

function identityChanged(oldId, newId) {
  serverMessage(`${oldId} is now known as ${newId}`);
}

function onClosed(socket) {
  let { id } = clients.get(socket);
  serverMessage(`${id} has left`);
  clients.delete(socket);
}

function updatePresence(socket, arg, arg2) {
  let data = clients.get(socket);
  data.lastSeen = Date.now();
  clients.set(socket, data);
}

function onConnect(socket) {
  const id = 'anonymous_' + anonymous++;
  clients.set(socket, { id, lastSeen: Date.now() })

  socket.on('message', onMessage.bind(null, socket));
  socket.on('closed', onClosed.bind(null, socket));

  socket.on('ping', updatePresence.bind(null, socket));
  socket.on('pong', updatePresence.bind(null, socket));

  serverMessage(`${id} has joined.`);
}

function onIdentifyEvent(socket, payload) {
  let old = clients.get(socket);
  identityChanged(old.id, payload.data);
  clients.set(socket, { id: payload.data })
}

function onMessage(socket, message) {
  message = message.trim('\n');
  let payload = JSON.parse(message);
  let { id } = clients.get(socket);
  switch(payload.event) {
    case 'identify':
      onIdentifyEvent(socket, payload);
      break;
    case 'chat':
      chatMessage(`${id}> ${payload.data}`);
      break;
    case 'disconnect':
      onClosed(socket);
      break;
  }
}

server.on("connection", onConnect);
server.on('listening', () => console.log('Alive.'));

setInterval(() => {
  for (let client of clients.keys()) {
    let data = clients.get(client);
    client.ping();
  }

  for (let [client, data] of clients.entries()) {
    if (Date.now() - data.lastSeen > 5000) {
      onClosed(client);
    }
  }

}, 1000)
