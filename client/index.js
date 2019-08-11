const { filter, map } = require('rxjs/operators');
const { View } = require ('./view');
const { Messaging } = require('./client');
const { timer } = require('rxjs')

let ui = new View();
let msg = new Messaging();

msg.events$
  .pipe(filter(a => a.event === 'chat'))
  .subscribe(evt => ui.addMessage(evt.data));

ui.events$
  .pipe(filter(a => a.event === 'chat'))
  .subscribe(evt => msg.message(evt.data))

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

ui.events$
  .pipe(filter(a => a.event === 'quit'))
  .subscribe(evt => msg.quit())
