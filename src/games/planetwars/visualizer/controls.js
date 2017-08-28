let mod = 1;

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
    if (mod < 4) {
      mod += 0.25;
      speed = base_speed * mod;
      updateSpeed(1 / mod);
    }
  })

  d3.select('#speedup').on("click", e => {
    if (mod > 0.25) {
      mod -= 0.25;
      speed = base_speed * mod;
      updateSpeed(1 / mod);
    }
  })

  d3.select('#turn_slider')
    .attr('min', 0)
    .attr('max', maxturn)
    .attr('step', 1)
    .on('change', e => {
      changeTurnCallback(d3.select('#turn_slider').node().value);
    });
  updateSpeed(1 / mod);
}

function updateSpeed(val) {
  d3.select('.speed').text("Speed x" + val);
}
