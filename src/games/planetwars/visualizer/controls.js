let mod = 3;
var speeds = [0.25, 0.33, 0.5, 1, 2, 3, 4];

function attachEvents(maxturn, togglePlaybackCallback, changeTurnCallback) {
  d3.select('#toggleplay').on("click", e => {
    var button = d3.select('#toggleplay');
    if (togglePlaybackCallback()) {
      button.text("\u23F8");
    } else {
      button.text("\u25B6");
    }
  });

  d3.select('#speeddown').on("click", e => {
    if (mod > 0) {
      mod--;
      speed = base_speed / speeds[mod];
      updateSpeed(speeds[mod]);
    }
  })

  d3.select('#speedup').on("click", e => {
    if (mod < speeds.length - 1) {
      mod++;
      speed = base_speed / speeds[mod];
      updateSpeed(speeds[mod]);
    }
  })

  d3.select('#turn_slider')
    .attr('min', 0)
    .attr('max', maxturn)
    .attr('step', 1)
    .on('change', e => {
      changeTurnCallback(d3.select('#turn_slider').node().value);
    });
  updateSpeed(speeds[mod]);
}

function updateSpeed(val) {
  d3.select('.speed').text("Speed x" + val);
}
