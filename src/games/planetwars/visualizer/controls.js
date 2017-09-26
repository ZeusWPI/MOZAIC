const d3 = require('d3');
const Config = require('./config');

class Controls {
  constructor(model) {
    this.mod = 3;

    // Set visibility for some buttons
    d3.select('#unhide').classed('invisible', true);
    d3.select('#unhide_score').classed('invisible', true);
    d3.select('#hide_score').classed('invisible', false);
    d3.select('#end_card').classed("invisible", true);
    d3.select('#pause').classed('invisible', true);

    d3.select('#hide').on("click", e => {
      d3.select('#controlbar').classed('invisible', true);
      d3.select('#hide').classed('invisible', true);
      d3.select('#unhide').classed('invisible', false);
    });
    d3.select('#unhide').on("click", e => {
      d3.select('#controlbar').classed('invisible', false);
      d3.select('#hide').classed('invisible', false);
      d3.select('#unhide').classed('invisible', true);
    });
    d3.select('#hide_score').on("click", e => {
      d3.select('#score').classed('invisible', true);
      d3.select('#hide_score').classed('invisible', true);
      d3.select('#unhide_score').classed('invisible', false);
    });
    d3.select('#unhide_score').on("click", e => {
      d3.select('#score').classed('invisible', false);
      d3.select('#hide_score').classed('invisible', false);
      d3.select('#unhide_score').classed('invisible', true);
    });
    d3.select('#hide_card').on("click", e => {
      d3.select('#end_card').classed('invisible', true);
    });
  }

  attachEvents(model) {
    d3.select('#play').on("click", e => {
      model.run_binder.update(true);
    });

    d3.select('#pause').on("click", e => {
      model.run_binder.update(false);
    });

    d3.select('#next').on("click", e => {
      model.turn_binder.update((model.turn_binder.value) + 1);
    });

    d3.select('#previous').on("click", e => {
      model.turn_binder.update((model.turn_binder.value) - 1);
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
      model.turn_binder.update(model.maxTurns);
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

  setPlayPauseButtonState(playing) {
    var play_button = d3.select('#play');
    var pause_button = d3.select('#pause');
    if (playing) {
      play_button.classed('invisible', true);
      pause_button.classed('invisible', false);
    } else {
      play_button.classed('invisible', false);
      pause_button.classed('invisible', true);
    }
  }

  changeTurnHandler(new_turn, model) {
    d3.select('#turn_slider').node().value = new_turn;
    if (new_turn >= model.maxTurns) {
      d3.select('#end_card').classed("invisible", false);
    } else {
      d3.select('#end_card').classed("invisible", true);
    }
  }

  updateSpeed(model) {
    var speed_mod = Config.speed_mods[this.mod];
    model.speed_binder.update(Config.base_speed / speed_mod);
    d3.select('.speed').text("Speed x" + Config.speed_mods[this.mod]);
  }
}

module.exports = Controls;
