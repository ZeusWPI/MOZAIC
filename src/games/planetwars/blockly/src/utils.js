function minimum_by(list, fun) {
  var minimizing_elem = list[0];
  var min = fun(minimizing_elem);
  for (var i = 1; i < list.length; i++) {
    if (fun(list[i]) < min) {
      minimizing_elem = list[i];
    }
  }
  return minimizing_elem;
}

function maximum_by(list, fun) {
  var maximizing_elem = list[0];
  var max = fun(maximizing_elem);
  for (var i = 1; i < list.length; i++) {
    if (fun(list[i]) > max) {
      maximizing_elem = list[i];
    }
  }
  return maximizing_elem;
}

function distance(p1, p2) {
  let dx = p1['x'] - p2['x'];
  let dy = p1['y'] - p2['y'];
  let dist = Math.sqrt(Math.pow(dx, 2) + Math.pow(dy, 2));
  return Math.ceil(dist);
}

module.exports = {
  minimum_by,
  maximum_by,
  distance
};
