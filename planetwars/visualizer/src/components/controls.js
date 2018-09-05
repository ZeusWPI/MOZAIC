const React = require('react');
const h = require('react-hyperscript');
const {
  div,
  button,
  i,
  input,
  p
} = require('hyperscript-helpers')(h);
let styles = require('./controls.scss');

function fa_icon(name) {
  return h('i.fa.fa-' + name, {
    'aria-hidden': true
  });
}

// TODO: maybe extract button functionality in helper functions
class Controls extends React.Component {

  playButton() {
    if (this.props.playing) {
      return button(
        `.${styles.button}`, {
          title: 'Pause',
          onClick: e => this.props.setPlaying(false)
        }, [fa_icon('pause')]
      );
    } else {
      return button(
        `.${styles.button}`, {
          title: 'Play',
          onClick: e => this.props.setPlaying(true)
        }, [fa_icon('play')]
      );
    }
  }

  render() {
    return div(`.${styles.controls}`, [
      input(`.${styles.turnSlider}`, {
        type: 'range',
        value: this.props.turnNum,
        className: 'control',
        max: this.props.numTurns,
        onChange: e => this.props.setTurn(+e.target.value)
      }),
      div(`.${styles.controlButtons}`, [
        div(`.${styles.turnControls}`, [
          button(
            `.${styles.button}`, {
              title: 'Go to first turn',
              onClick: e => this.props.setTurn(0)
            }, [fa_icon('fast-backward')]
          ),
          button(
            `.${styles.button}`, {
              title: 'Go to previous turn',
              onClick: e => this.props.setTurn(this.props.turnNum - 1)
            }, [fa_icon('step-backward')]
          ),
          this.playButton(),
          button(
            `.${styles.button}`, {
              title: 'Go to next turn',
              onClick: e => this.props.setTurn(this.props.turnNum + 1)
            }, [fa_icon('step-forward')]
          ),
          button(
            `.${styles.button}`, {
              title: 'Go to last turn',
              onClick: e => this.props.setTurn(this.props.numTurns)
            }, [fa_icon('fast-forward')]
          ),
          div(`.${styles.turnProgress}`, [p(`${this.props.turnNum} / ${this.props.numTurns}`)])
        ]),
        div(`.${styles.speedControls}`, [
          div(`.${styles.speed}`, [p(`Speed x${this.props.speed}`)]),
          button(
            `.${styles.button}`, {
              title: 'Decrease speed',
              onClick: e => this.props.setSpeed(this.props.speed / 2)
            }, [fa_icon('minus')]
          ),
          button(
            `.${styles.button}`, {
              title: 'Increase speed',
              onClick: e => this.props.setSpeed(this.props.speed * 2)
            }, [fa_icon('plus')]
          )
        ])
      ]),
    ]);
  }
}

module.exports = Controls;