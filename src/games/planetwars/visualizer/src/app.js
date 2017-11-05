const ReactDOM = require('react-dom');
const h = require('react-hyperscript');
const Visualizer = require('./visualizer');

window.onload = function() {
  ReactDOM.render(h(Visualizer), document.getElementById('visualizer'));
};