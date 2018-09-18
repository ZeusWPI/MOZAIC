import React from 'react';
import ReactDOM from 'react-dom';
import inject from 'components/BlocklyEditor';

const MOUNT_NODE = document.getElementById('root');

let render = () => {
  // Have to use require here, or hot reloading wont work because of reasons
  const Root = require('./components/App').default;
  ReactDOM.render(<Root />, MOUNT_NODE);
  inject('blockly');
};

// Development Tools
// ------------------------------------
if (__DEV__) {
  if (module.hot) {
    const renderApp = render;

    render = () => {
      try {
        renderApp();
      } catch (e) {
        console.error(e);
      }
    };

    // Setup hot module replacement
    module.hot.accept(['components/App.js'], () =>
      setImmediate(() => {
        ReactDOM.unmountComponentAtNode(MOUNT_NODE);
        render();
      }),
    );
  }
}

// Let's Go!
// ------------------------------------
render();
