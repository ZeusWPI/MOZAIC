const d3 = require('d3');
const Config = require('./config');
const Visualizer = require('./visualizer');

class Controls {
  constructor(visualizer) {
    this.visualizer = visualizer;
    this.mod = 3;
    this.updateSpeed(Config.speed_mods[this.mod]);
    d3.select('#unhide').attr("hidden", true);
    d3.select('#unhide_score').attr("hidden", true);
    d3.select('#hide_score').attr("hidden", true);
    d3.select('#end_card').attr("hidden", true);

    d3.select('#hide').on("click", e => {
      d3.select('#controlbar').attr("hidden", true);
      d3.select('#hide').attr("hidden", true);
      d3.select('#unhide').attr("hidden", null);
    });
    d3.select('#unhide').on("click", e => {
      d3.select('#controlbar').attr("hidden", null);
      d3.select('#hide').attr("hidden", null);
      d3.select('#unhide').attr("hidden", true);
    });

    d3.select('#hide_score').on("click", e => {
      d3.select('#score').style('display', 'none');
      d3.select('#hide_score').attr("hidden", true);
      d3.select('#unhide_score').attr("hidden", null);
    });
    d3.select('#unhide_score').on("click", e => {
      d3.select('#score').style('display', 'block');
      d3.select('#hide_score').attr("hidden", null);
      d3.select('#unhide_score').attr("hidden", true);
    });
    d3.select('#file-select').on('change', e => this.readLog(e), false);
  }

  readLog(e) {
    if (this.visualizer) {
      this.hidePauseButton();
      this.visualizer.clear();
    }

    var reader = new FileReader();
    reader.onload = event => {
      var log = event.target.result;
      this.visualizer.visualize(log);
      this.attachEvents(this.visualizer.turn_controller);
    };

    reader.readAsText(e.target.files[0]);
  }

  attachEvents(turn_controller) {
    d3.select('#hide_score').attr("hidden", null);

    d3.select('#play').on("click", e => {
      turn_controller.play();
    });

    d3.select('#pause').on("click", e => {
      turn_controller.pause();
    });

    d3.select('#next').on("click", e => {
      turn_controller.nextTurn();
    });

    d3.select('#previous').on("click", e => {
      turn_controller.previousTurn();
    });

    d3.select('#speeddown').on("click", e => {
      if (this.mod > 0) {
        this.mod--;
        var speed_mod = Config.speed_mods[this.mod];
        turn_controller.speed = Config.base_speed / speed_mod;
        this.updateSpeed(Config.speed_mods[this.mod]);
      }
    });

    d3.select('#speedup').on("click", e => {
      if (this.mod < Config.speed_mods.length - 1) {
        this.mod++;
        var speed_mod = Config.speed_mods[this.mod];
        turn_controller.speed = Config.base_speed / speed_mod;
        this.updateSpeed(Config.speed_mods[this.mod]);
      }
    });

    d3.select('#tostart').on("click", e => {
      turn_controller.turnbinder.update(0);
      turn_controller.runningbinder.update(false);
    });

    d3.select('#toend').on("click", e => {
      turn_controller.turnbinder.update(turn_controller.maxTurns);
      turn_controller.runningbinder.update(false);
    });

    d3.select('#turn_slider')
      .attr('min', 0)
      .attr('max', turn_controller.maxTurns)
      .attr('step', 1)
      .on('change', () => {
        turn_controller.turnbinder.update(parseInt(d3.select('#turn_slider').node().value));
      });

    turn_controller.turnbinder.registerCallback(v => {
      d3.select('#turn_slider').node().value = v;
      if (v >= turn_controller.maxTurns) {
        d3.select('#end_card').attr('hidden', null);
      } else {
        d3.select('#end_card').attr('hidden', 'true');
      }
    });
    turn_controller.runningbinder.registerCallback(v => {
      if (v) {
        this.hidePlayButton();
      } else {
        this.hidePauseButton();
      }
    });
  }

  hidePauseButton() {
    var play_button = d3.select('#play');
    var pause_button = d3.select('#pause');
    play_button.attr("hidden", null);
    pause_button.attr("hidden", true);
  }

  hidePlayButton() {
    var play_button = d3.select('#play');
    var pause_button = d3.select('#pause');
    play_button.attr("hidden", true);
    pause_button.attr("hidden", null);
  }

  updateSpeed(val) {
    d3.select('.speed').text("Speed x" + val);
  }
}

module.exports = Controls;
