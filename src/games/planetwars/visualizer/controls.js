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
      hideBar: false
    };
    /*
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
            defaultValue: '0',
            className: 'control'
          }),
          div('.turncontrols', [
            createButton('#tostart', '', 'fast-backward'),
            createButton('#previous', '', 'step-backward'),
            h(ToggleButton, {
              selector: '#pause',
              title1: 'Pause game',
              title2: 'Play game',
              icon1: 'pause',
              icon2: 'play',
              callback1: () => this.props.model.run_binder.update(true),
              callback2: () => this.props.model.run_binder.update(false)
            }),
            createButton('#next', '', 'step-forward'),
            createButton('#toend', '', 'fast-forward'),
            p('#turn_progress', '100 / 100')
          ]),
          div('.speedcontrols', [
            p('.speed', 'Speed x1'),
            createButton('#speeddown', '', 'minus'),
            createButton('#speedup', '', 'plus')
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

class ToggleButton extends React.Component {
  constructor(props) {
    super(props);
    this.toggled = false;
    this.icon1 = this.props.icon1;
    this.icon2 = this.props.icon2;
    this.title1 = this.props.title1;
    this.title2 = this.props.title2;
    this.state = {
      icon: this.icon1,
      title: this.title1
    };
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
    console.log('testing');
    if (this.toggled) {
      this.setState({
        icon: this.icon1,
        title: this.title1
      });
      this.props.callback1();
    } else {
      this.setState({
        icon: this.icon2,
        title: this.title2
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
