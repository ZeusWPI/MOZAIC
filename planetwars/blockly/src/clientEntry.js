import React from 'react';
import ReactDOM from 'react-dom';

const MOUNT_NODE = document.getElementById('root');

let render = () => {
  const Root = require('./components/App').default;
  ReactDOM.render(<Root />, MOUNT_NODE);
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
