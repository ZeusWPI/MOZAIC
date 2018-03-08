function minimum_by(list, fun) {
  let idx = list.map(fun).reduce((acc, x, i, arr) => x < arr[acc] ? i : acc, 0);
  return list[idx];
}

function maximum_by(list, fun) {
  let idx = list.map(fun).reduce((acc, x, i, arr) => x > arr[acc] ? i : acc, 0);
  return list[idx];
}

function sort_by(list, fun) {
  var mapped = list.map( (elem, i) => {
    return { index: i, value: fun(elem)};
  });
  mapped.sort((a, b) => a.value - b.value);
  return mapped.map(elem => list[elem.index]);
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
  sort_by,
  distance
};
