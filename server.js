const WebSocket = require('ws');
const { timer } = require('rxjs');

const server = new WebSocket.Server({ port: 8080 });
const clients = new Map();

let anonymous = 0;

/**
 * Send json to a specific client
 * @param {WebSocket} socket
 * @param {any} obj 
 */
function send(socket, obj) {
  const data = JSON.stringify(obj);
  socket.send(data);
}

/**
 * Broadcast data to all clients
 * @param {any} obj
 */
function broadcast(obj) {
  for (const client of server.clients) {
    send(client, obj);
  }
}

/**
 * Broadcast to everyone that someone sent a chat message
 * @param {string} message
 */
function chatMessage(message) {
  broadcast({event: 'chat', data: message});
}

/**
 * Send a server info message to everyone
 * @param {string} message
 */
function serverMessage(message) {
  broadcast({event: 'chat', data: `Server> ${message}`});
}

/**
 * Tell everyone that somebody changed their name
 * @param {string} oldName
 * @param {string} newName 
 */
function nameChange(oldName, newName) {
  serverMessage(`${oldName} is now known as ${newName}`);
}

/**
 * Respond to the client's connecting closing, telling everyone they left
 * @param {WebSocket} socket
 */
function onClosed(socket) {
  let { id } = clients.get(socket);
  serverMessage(`${id} has left`);
  clients.delete(socket);
}

/**
 * Update the lastSeen of this client so we don't disconnect them automatically
 * @param {WebSocket} socket
 */
function updatePresence(socket) {
  let data = clients.get(socket);
  data.lastSeen = Date.now();
  clients.set(socket, data);
}

/**
 * Respond to someone connecting to the server
 * @param {WebSocket} socket
 */
function onConnect(socket) {
  // Give them a name and that we saw them now
  const id = 'anonymous_' + anonymous++;
  clients.set(socket, { id, lastSeen: Date.now() })

  // Bind when they send us a message, or disconnect
  socket.on('message', onMessage.bind(null, socket));
  socket.on('closed', onClosed.bind(null, socket));

  // Hook up the presence updater
  socket.on('ping', updatePresence.bind(null, socket));
  socket.on('pong', updatePresence.bind(null, socket));

  // Let everyone know that someone new has joined
  serverMessage(`${id} has joined.`);
}

/**
 * Respond to the client changing their name
 * @param {WebSocket} socket
 * @param {object} payload
 */
function onIdentifyEvent(socket, payload) {
  let old = clients.get(socket);
  nameChange(old.id, payload.data);
  clients.set(socket, { id: payload.data })
}

/**
 * Respond to the user sending an event
 * @param {WebSocket} socket
 * @param {object} message
 */
function onMessage(socket, message) {
  let payload = JSON.parse(message);
  let { id } = clients.get(socket);
  switch(payload.event) {
    case 'identify':
      onIdentifyEvent(socket, payload);
      break;
    case 'chat':
      chatMessage(`${id}> ${payload.data.trim().trim('\n')}`);
      break;
    case 'disconnect':
      onClosed(socket);
      break;
  }
}

// Set up the server handlers
server.on("connection", onConnect);
server.on('listening', () => console.log('Alive.'));

// Set up the system that automatically disconnects people
setInterval(() => {
  // Send out the "are you there" signal
  for (let client of clients.keys()) {
    let data = clients.get(client);
    client.ping();
  }

  // Low volume server, so we disconnect after 5 seconds
  for (let [client, data] of clients.entries()) {
    // You are outdated, so disconnect plox
    if (Date.now() - data.lastSeen > 5000) {
      onClosed(client);
    }
  }
}, 1000)
