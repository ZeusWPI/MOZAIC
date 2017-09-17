class Controls {
  constructor() {
    this.mod = 3;
    this.updateSpeed(Config.speed_mods[this.mod]);
  }

  readLog(e) {
    if (this.visualizer) {
      this.hidePauseButton();
      this.visualizer.clear();
    }
    
    var reader = new FileReader();
    reader.onload = event => {
      var log = event.target.result;
      this.visualizer = new Visualizer(log);
      this.attachEvents(this.visualizer.turn_controller);
    }

    reader.readAsText(e.files[0]);
  }

  attachEvents(turn_controller) {
    
    d3.select('#play').on("click", e => {
      turn_controller.startTimer();
      this.hidePlayButton();
    });

    d3.select('#pause').on("click", e => {
      turn_controller.stopTimer();
      this.hidePauseButton();
    });

    d3.select('#next').on("click", e => {
      turn_controller.nextTurn();
    });

    d3.select('#previous').on("click", e => {
      turn_controller.previousTurn();
    });

    d3.select('#toggleplay').on("click", e => {
      var button = d3.select('#toggleplay');
      if (turn_controller.toggleTimer()) {
        button.node().innerHTML('<img src="res/pause.svg">');
      } else {
        button.node().innerHTML('<img src="res/play.svg">');
      }
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
      turn_controller.showTurn(0);
      turn_controller.stopTimer();
      this.hidePauseButton();
    });

    d3.select('#toend').on("click", e => {
      turn_controller.showTurn(turn_controller.maxTurns);
      turn_controller.stopTimer();
      this.hidePlayButton();
    });

    d3.select('#turn_slider')
      .attr('min', 0)
      .attr('max', turn_controller.maxTurns)
      .attr('step', 1)
      .on('change', e => {
        turn_controller.showTurn(d3.select('#turn_slider').node().value);
      });
  }

  hidePauseButton(){
    var play_button = d3.select('#play');
    var pause_button = d3.select('#pause');
    play_button.attr("hidden", null);
    pause_button.attr("hidden", true);
  }

  hidePlayButton(){
    var play_button = d3.select('#play');
    var pause_button = d3.select('#pause');
    play_button.attr("hidden", true);
    pause_button.attr("hidden", null);
  }

  updateSpeed(val) {
    d3.select('.speed').text("Speed x" + val);
  }
}

var controls = new Controls();
