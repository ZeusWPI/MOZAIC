const d3 = require('d3');

const Visuals = require('./visuals');
const Controls = require('./controls');
const Game = require('./game');
const Utils = require('./util');

class Visualizer {

  constructor() {
    this.model = new Game();
    this.controls = new Controls();
    this.visuals = new Visuals();


    this.model.speed_binder.registerCallback(s => {
      if (this.model.run_binder.value) {
        this._stopTimer();
        this._startTimer();
      }
    });

    this.model.turn_binder.registerCallback(v => {
      this.running = this._showTurn(v);
    });

    this.model.run_binder.registerCallback(v => {
      if (v) {
        this._startTimer();
      } else {
        this._stopTimer();
      }
    });
  }

  visualize(log) {
    this.clear();
    this.model.init(log);

    //this.visuals.generatePlanetStyles(this.model.turns[0].planets);
    Visuals.Preprocessing.addPlanetCues(this.model.turns);
    this.visuals.generateViewBox(this.model.turns[0].planets);
    this.visuals.createZoom();
    this.visuals.generateWinnerBox(this.model.winner, this.model.color_map[this.model.winner]);
    this.model.turn_binder.update(0);

    this.controls.attachEvents(this.model);
    this.visuals.animateFleets();
  }

  clear() {
    this.visuals.clearVisuals();
  }

  play() {
    this.model.run_binder.update(true);
  }

  pause() {
    this.model.run_binder.update(false);
  }

  nextTurn() {
    this.model.turn_binder.update((this.model.turn_binder.value) + 1);
  }

  previousTurn() {
    this.model.turn_binder.update((this.model.turn_binder.value) - 1);
  }

  _showTurn(newTurn) {
    if (newTurn >= this.model.turns.length) {
      this.model.run_binder.update(false);
    } else {
      var turn = this.model.turns[newTurn];
      this.visuals.addNewObjects(turn, this.model.color_map);
      this.visuals.update(turn, this.model);
    }
  }

  _startTimer() {
    var callback = elapsed => {
      this.nextTurn();
    };
    this.turn_timer = d3.interval(callback, this.model.speed_binder.value);

  }

  _stopTimer() {
    if (this.turn_timer) {
      this.turn_timer.stop();
    }
  }
}

module.exports = Visualizer;
