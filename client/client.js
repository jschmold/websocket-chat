const WebSocket = require('ws');
const { BehaviorSubject } = require('rxjs');

module.exports.Messaging = class {

  get events$() {
    return this._eventSubject.asObservable();
  }

  _eventSubject = new BehaviorSubject('init');

  quit() {
    this.send({ event: 'disconnect' });
    setTimeout(() => {
      this._socket.close();
      process.exit();
    }, 50)
  }

  send(obj) {
    this._socket.send(JSON.stringify(obj));
  }

  identify(newName) {
    this.send({ event: 'identify', data: newName });
  }

  message(message) {
    this.send({ event: 'chat', data: message })
  }

  constructor() {
    this._socket = new WebSocket('ws://localhost:8080');
    this._socket.on('message', msg => this._eventSubject.next(JSON.parse(msg)));
    this._socket.on('close', _ => this._eventSubject.next({event: 'disconnect'}));
    this._socket.on('ping', _ => this._socket.pong());
    this._socket.on('pong', _ => this._socket.ping());
  }
}
