const { screen, textarea, textbox } = require('blessed')
const {  BehaviorSubject } = require('rxjs');

module.exports.View = class {

  get events$() {
    return this._eventSubject.asObservable();
  }

  _eventSubject = new BehaviorSubject({ event: 'init' })

  /** Store the messages (so we can scroll back) in this array */
  messages = [];

  screen = screen({ smartCSR: true });

  /** The box that holds the messaging */
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

  /** The input area for typing in chat */
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

    /** i means input in vim */
    this.screen.key('i', _ => {
      this.inputArea.focus()
      this.redraw();
    });

    /** m for messages, but I don't think this actually does anything */
    this.screen.key('m', _ => {
      this.messageBox.focus();
      this.redraw();
    });

    /** When the screen is the thing that's active, ctrl-c closes */
    this.screen.key('C-c', _ => this._eventSubject.next({ event: 'quit' }));

    /** When the messages are the thing that's active, scroll down 1 */
    this.messageBox.key('j', _ => {
      this.messageBox.scroll(1);
      this.redraw();
    });

    /** When the messages are the thing that's active, scroll up 1 */
    this.messageBox.key('k', _ => {
      this.messageBox.scroll(-1);
      this.redraw();
    });

    /** When the input area presses enter, send the message on through */
    this.inputArea.on('submit', value => this.onSubmit(value));

    /** Add the visual elements to the screen */
    this.screen.append(this.messageBox);
    this.screen.append(this.inputArea);

    /** Focus on what we care about and render */
    this.inputArea.focus();
    this.screen.render();
  }

  /**
   * A helper function that reminds me of OpenGL
   */
  redraw() {
    this.screen.render();
  }

  /**
   * Add a string to the messages
   * @param {string} msg
   */
  addMessage(msg) {
    // Server doesn't tell us when it was sent, so we put in when we 
    // received it
    this.messages.push(`${new Date().toLocaleString()} ${msg}`.trim('\n'));
    this.messageBox.content = this.messages.join('\n');
    this.messageBox.scroll(1);
    this.screen.render();
  }

  /**
   * What happens when enter is pressed
   * @param {string} value
   */
  onSubmit(value) {
    // this has to happen anyways, so do it first
    this.inputArea.clearValue();
    this.inputArea.focus();
    this.redraw();

    // They didn't give us anything useful
    if (value.trim().length === 0) {
      return;
    }

    if (value[0] === '/') {
      // it was a command
      this._eventSubject.next({ event: 'command', data: value });
    } else {
      // it was a chat message
      this._eventSubject.next({ event: 'chat', data: value });
    }
  }
}
