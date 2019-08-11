const { screen, textarea, textbox } = require('blessed')
const {  BehaviorSubject } = require('rxjs');

module.exports.View = class {

  get events$() {
    return this._eventSubject.asObservable();
  }

  _eventSubject = new BehaviorSubject({ event: 'init' })

  messages = [];

  screen = screen({ smartCSR: true });

  messageBox = textarea({
    top: 'top',
    left: 'center',
    width: '100%',
    height: '80%',
    content: 'Welcome to chat!',
    border: { type: 'line' },
    scrollbar: {
      style: { bg: 'grey' },
      track: { bg: 'green' }
    }
  });

  inputArea = textbox({
    top: '80%',
    left: 'center',
    width: '100%',
    height: '20%',
    border: { type: 'line' },
    inputOnFocus: true,
  });

  constructor() {
    this.screen.title = 'Jonner Chat';

    this.screen.key('i', _ => {
      this.inputArea.focus()
      this.redraw();
    });

    this.screen.key('m', _ => {
      this.messageBox.focus();
      this.messageBox.bg = 'red';
      this.redraw();
    });

    this.screen.key('C-c', _ => this._eventSubject.next({ event: 'quit' }));

    this.messageBox.key('j', _ => {
      this.messageBox.scroll(1);
      this.redraw();
    });

    this.messageBox.key('k', _ => {
      this.messageBox.scroll(-1);
      this.redraw();
    });

    this.inputArea.on('submit', value => this.onSubmit(value));

    this.screen.append(this.messageBox);
    this.screen.append(this.inputArea);

    this.inputArea.focus();
    this.screen.render();
  }

  redraw() {
    this.screen.render();
  }

  addMessage(msg) {
    this.messages.push(`${new Date().toLocaleString()} ${msg}`.trim('\n'));
    this.messageBox.content = this.messages.join('\n');
    this.messageBox.scroll(1);
    this.screen.render();
  }

  onSubmit(value) {
    this.inputArea.clearValue();
    this.inputArea.focus();
    this.redraw();

    if (value.trim().length === 0) {
      return;
    }

    if (value[0] === '/') {
      this._eventSubject.next({ event: 'command', data: value });
    } else {
      this._eventSubject.next({ event: 'chat', data: value });
    }
  }
}
