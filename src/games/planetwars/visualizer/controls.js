let mod = 1.5;

function attachEvents() {
  d3.select('#toggleplay').on("click", e => {
    toggleTimer();
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

}

attachEvents();
