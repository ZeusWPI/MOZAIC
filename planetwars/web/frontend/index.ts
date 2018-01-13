import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { h, h1 } from 'react-hyperscript-helpers';

class App extends React.Component<any, any> {
  render() {
    return h1("Hello World!");
  }
}

ReactDOM.render(h(App), document.getElementById('app'));