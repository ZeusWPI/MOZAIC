let mod = 1.5;

function attachEvents() {
  d3.select('#toggleplay').on("click", e => {
    console.log("clicked");
    toggleTimer();
  });

  d3.select('#speeddown').on("click", e => {
    if (mod < 1.5) {
      mod += 0.25;
      speed = base_speed * mod;
    }
  });

  d3.select('#speedup').on("click", e => {
    if (mod > 0.5) {
      mod -= 0.25;
      speed = base_speed * mod;
    }
  });

}

attachEvents();
