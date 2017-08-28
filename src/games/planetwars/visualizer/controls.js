let mod = 1.5;

function attachEvents(maxturn, togglePlaybackCallback, changeTurnCallback) {
  d3.select('#toggleplay').on("click", e => {
    togglePlaybackCallback();
  }).style("font-family", "Segoe UI Symbol");

  d3.select('#speeddown').on("click", e => {
    if (mod < 3) {
      mod += 0.25;
      speed = base_speed * mod;
    }
  }).style("font-family", "Segoe UI Symbol");

  d3.select('#speedup').on("click", e => {
    if (mod > 0.1) {
      mod -= 0.15;
      speed = base_speed * mod;
    }
  }).style("font-family", "Segoe UI Symbol");
  d3.select('#turn_slider')
    .attr('min', 0)
    .attr('max', maxturn)
    .attr('step', 1)
    .attr('value', 0)
    .on('change', e => {
      changeTurnCallback(d3.select('#turn_slider').node().value);
    });
}
