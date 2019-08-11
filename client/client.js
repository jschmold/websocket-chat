const WebSocket = require('ws');
const { BehaviorSubject } = require('rxjs');

module.exports.Messaging = class {

  get events$() {
    return this._eventSubject.asObservable();
  }

  _eventSubject = new BehaviorSubject('init');

  /** Be nice and tell the host we are leaving */
  quit() {
    this.send({ event: 'disconnect' });
    setTimeout(() => {
      this._socket.close();
      process.exit();
    }, 50)
  }

  /**
   * Send JSON to the host
   * @param {any} obj
   */
  send(obj) {
    this._socket.send(JSON.stringify(obj));
  }

  /**
   * Give the host a new name to call us
   * @param {string} newName
   */
  identify(newName) {
    this.send({ event: 'identify', data: newName });
  }

  /**
   * Send a chat message
   * @param {string} message
   */
  message(message) {
    this.send({ event: 'chat', data: message })
  }

  constructor() {
    // Connect to the local server
    this._socket = new WebSocket('ws://localhost:8080');
    // Pipe the json-exclusive messages from the serrver to the 
    // behavior subject, letting us listen to what's happening
    this._socket.on('message', msg => this._eventSubject.next(JSON.parse(msg)));

    // If the server closes our connection this just does a disconnect event
    this._socket.on('close', _ => this._eventSubject.next({event: 'disconnect'}));

    // Respond to the pinging so the server knows we are here
    this._socket.on('ping', _ => this._socket.pong());
    this._socket.on('pong', _ => this._socket.ping());
  }
}
