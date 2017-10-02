const d3 = require('d3');
const Config = require('./config');
const Utils = require('./util');
const space_math = Utils.SpaceMath;

class Controls {
  constructor() {
    this.mod = 3;

    this.hide('#unhide');
    this.hide('#unhide_score');
    this.show('#hide_score');
    this.hide('#end_card');
    this.hide('#pause');

    d3.select('#hide').on("click", e => {
      this.hide('#controlbar');
      this.hide('#hide');
      this.show('#unhide');
    });

    d3.select('#unhide').on("click", e => {
      this.show('#controlbar');
      this.show('#hide');
      this.hide('#unhide');
    });

    d3.select('#hide_score').on("click", e => {
      this.hide('#score');
      this.hide('#hide_score');
      this.show('#unhide_score');
    });

    d3.select('#unhide_score').on("click", e => {
      this.show('#score');
      this.show('#hide_score');
      this.hide('#unhide_score');
    });

    d3.select('#hide_card').on("click", e => {
      this.hide('#end_card');
    });

    const file_select = document.getElementById('file-select');
    if (file_select != null) {
      file_select.onchange = function() {
        var reader = new FileReader();
        reader.onload = event => {
          var log = event.target.result;
          visualizer.visualize(log);
          visualizer.play();
        };
        reader.readAsText(file_select.files[0]);
      };
    }
  }

  attachEvents(model) {
    d3.select('#play').on("click", e => {
      model.run_binder.update(true);
    });

    d3.select('#pause').on("click", e => {
      model.run_binder.update(false);
    });

    d3.select('#next').on("click", e => {
      this.setTurn(model.turn_binder.value + 1, model);
    });

    d3.select('#previous').on("click", e => {
      this.setTurn(model.turn_binder.value - 1, model);
    });

    d3.select('#speeddown').on("click", e => {
      if (this.mod > 0) {
        this.mod--;
        this.updateSpeed(model);
      }
    });

    d3.select('#speedup').on("click", e => {
      if (this.mod < Config.speed_mods.length - 1) {
        this.mod++;
        this.updateSpeed(model);
      }
    });

    d3.select('#tostart').on("click", e => {
      model.turn_binder.update(0);
      model.run_binder.update(false);
    });

    d3.select('#toend').on("click", e => {
      model.turn_binder.update(model.maxTurns - 1);
    });

    d3.select('#turn_slider')
      .attr('min', 0)
      .attr('max', model.maxTurns)
      .attr('step', 1)
      .on('change', () => {
        model.turn_binder.update(parseInt(d3.select('#turn_slider').node().value));
      });

    model.turn_binder.registerCallback(t => this.changeTurnHandler(t, model));
    model.run_binder.registerCallback(s => this.setPlayPauseButtonState(s));
  }

  setTurn(turn, model) {
    model.turn_binder.update(space_math.clamp(turn, 0, model.maxTurns));
  }

  setPlayPauseButtonState(playing) {
    if (playing) {
      this.hide('#play');
      this.show('#pause');
    } else {
      this.hide('#pause');
      this.show('#play');
    }
  }

  changeTurnHandler(new_turn, model) {
    d3.select('#turn_slider').node().value = new_turn;
    d3.select('#turn_slider').attr('title', new_turn);
    if (new_turn >= model.maxTurns) {
      this.show('#end_card');
    } else {
      this.hide('#end_card');
    }
    d3.select('#turn_progress').text(new_turn + ' / ' + model.maxTurns);
  }

  updateSpeed(model) {
    var speed_mod = Config.speed_mods[this.mod];
    model.speed_binder.update(Config.base_speed / speed_mod);
    d3.select('.speed').text("Speed x" + Config.speed_mods[this.mod]);
  }

  hide(id) {
    d3.select(id).classed("invisible", true);
  }

  show(id) {
    d3.select(id).classed("invisible", false);
  }
}

module.exports = Controls;
