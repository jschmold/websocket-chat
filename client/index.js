const { filter, map } = require('rxjs/operators');
const { View } = require ('./view');
const { Messaging } = require('./client');
const { timer } = require('rxjs')

let ui = new View();
let msg = new Messaging();

// Respond to chat events coming from the server
msg.events$
  .pipe(filter(a => a.event === 'chat'))
  .subscribe(evt => ui.addMessage(evt.data));

// Respond to chat events coming from the UI
ui.events$
  .pipe(filter(a => a.event === 'chat'))
  .subscribe(evt => msg.message(evt.data))

// Response to commands coming from the UI
ui.events$
  .pipe(
    filter(a => a.event === 'command'),
    map(a => a.data.split(' '))
  ).subscribe(([ command, ... args]) => {
    let cmd = command.substr(1);
    switch(cmd) {
      case 'identify':
        msg.identify(args.join(' '));
        break;
      case 'disconnect':
        msg.quit();
        break;
    }
  })

// Listen to when the UI says it wants to quit
ui.events$
  .pipe(filter(a => a.event === 'quit'))
  .subscribe(evt => msg.quit())
