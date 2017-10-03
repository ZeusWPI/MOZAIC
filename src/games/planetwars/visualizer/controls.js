const d3 = require('d3');
const Config = require('./config');
const Utils = require('./util');
const space_math = Utils.SpaceMath;
const React = require('react');
const h = require('react-hyperscript');
const {
  div,
  button,
  i,
  input,
  p
} = require('hyperscript-helpers')(h);

class Controls extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hideBar: false,
      turn: 0,
      running: false,
      mod: 3
    };
    this.props.model.turn_binder.registerCallback(t => {
      this.setState({
        turn: this.props.model.turn_binder.value
      });
    });
    this.props.model.run_binder.registerCallback(t => {
      this.setState({
        running: this.props.model.run_binder.value
      });
    });
    //this.mod = 3;
    /*
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
        }*/
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
    console.log('up');
    d3.select('#turn_slider').attr('value', new_turn);
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

  componentDidMount() {}

  render() {
    return div('#controls', [
      h(ToggleButton, {
        selector: '#hide',
        title1: 'Hide Controls',
        title2: 'Show Controls',
        icon1: 'chevron-down',
        icon2: 'chevron-up',
        callback1: () => this.setState({
          hideBar: true
        }),
        callback2: () => this.setState({
          hideBar: false
        })
      }),
      h(HideableComponent, {
        hide: this.state.hideBar,
        render: div('#controlbar', [
          input({
            type: 'range',
            id: 'turn_slider',
            value: this.state.turn,
            className: 'control',
            max: this.props.model.maxTurns,
            onChange: e => this.props.model.turn_binder.update(+e.target.value)
          }),
          div('.turncontrols', [
            h(ControlButton, {
              selector: '#to_start',
              title: 'Go to start of the game',
              icon: 'fast-backward',
              callback: () => {
                this.props.model.turn_binder.update(0);
                this.props.model.run_binder.update(false);
              }
            }),
            h(ControlButton, {
              selector: '#previous',
              title: 'Go back one turn',
              icon: 'step-backward',
              callback: () => {
                this.props.model.turn_binder.update(this.props.model.turn_binder.value - 1);
              }
            }),
            h(ToggleButton, {
              selector: '#pause',
              title1: 'Pause game',
              title2: 'Play game',
              icon1: 'pause',
              icon2: 'play',
              toggled: this.state.running,
              callback1: () => this.props.model.run_binder.update(true),
              callback2: () => this.props.model.run_binder.update(false)
            }),
            h(ControlButton, {
              selector: '#next',
              title: 'Go forward one turn',
              icon: 'step-forward',
              callback: () => {
                this.props.model.turn_binder.update(this.props.model.turn_binder.value + 1);
              }
            }),
            h(ControlButton, {
              selector: '#to_end',
              title: 'Go to end of the game',
              icon: 'fast-forward',
              callback: () => {
                this.props.model.turn_binder.update(this.props.model.maxTurns);
                this.props.model.run_binder.update(false);
              }
            }),
            p('#turn_progress', `${this.props.model.turn_binder.value} / ${this.props.model.maxTurns}`)
          ]),
          div('.speedcontrols', [
            p('.speed', `Speed x${Config.speed_mods[this.state.mod]}`),
            h(ControlButton, {
              selector: '#speed_down',
              title: 'Lower speed',
              icon: 'minus',
              callback: () => {
                if (this.state.mod > 0) {
                  this.setState({
                    mod: this.state.mod - 1
                  });
                  this.props.model.speed_binder.update(Config.base_speed / Config.speed_mods[this.state.mod]);
                }
              }
            }),
            h(ControlButton, {
              selector: '#speed_up',
              title: 'Increase speed',
              icon: 'plus',
              callback: () => {
                if (this.state.mod < Config.speed_mods.length - 1) {
                  this.setState({
                    mod: this.state.mod + 1
                  });
                  this.props.model.speed_binder.update(Config.base_speed / Config.speed_mods[this.state.mod]);
                }
              }
            })
          ])
        ])
      })
    ]);
  }
}

class HideableComponent extends React.Component {
  render() {
    if (this.props.hide)
      return null;
    return this.props.render;
  }

}

class ControlButton extends React.Component {
  constructor(props) {
    super(props);
    this.click = this.click.bind(this);
  }

  render() {
    return button(`${this.props.selector}.control.control-button`, {
      'title': this.props.title,
      'type': 'button',
      'aria-hidden': 'true',
      'onClick': this.click
    }, [
      i(`.fa.fa-${this.props.icon}`)
    ]);
  }

  click() {
    this.props.callback();
  }
}

class ToggleButton extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      icon: this.props.icon1,
      title: this.props.title1
    };
    this.togged = this.props.toggled;
    this.toggle = this.toggle.bind(this);
  }

  render() {
    return button(`${this.props.selector}.control.control-button`, {
      'title': this.state.title,
      'type': 'button',
      'aria-hidden': 'true',
      'onClick': this.toggle
    }, [
      i(`.fa.fa-${this.state.icon}`)
    ]);
  }

  toggle() {
    if (this.toggled) {
      this.setState({
        icon: this.props.icon1,
        title: this.props.title1
      });
      this.props.callback1();
    } else {
      this.setState({
        icon: this.props.icon2,
        title: this.props.title2
      });
      this.props.callback2();
    }
    this.toggled = !this.toggled;
  }
}

//TODO move this also this is duplicate prototype stuff ya kno
function createButton(selector, title, icon) {
  return button(`${selector}.control.control-button`, {
    'title': title,
    'type': 'button',
    'aria-hidden': 'true'
  }, [
    i(`.fa.fa-${icon}`)
  ])
}

module.exports = Controls;
