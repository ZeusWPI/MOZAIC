class SpaceMath {
  toRadians(angle) {
    return angle * (Math.PI / 180);
  }

  toDegrees(angle) {
    return angle * (180 / Math.PI);
  }

  euclideanDistance(e1, e2) {
    return Math.sqrt(Math.pow(e1.x - e2.x, 2) + Math.pow(e1.y - e2.y, 2));
  }

  manhattenDistance(p1, p2) {
    return p1.x - p2.x + p1.y - p2.y;
  }

  randomIntBetween(min, max) {
    return Math.floor(this.randomBetween(min, max));
  }

  randomBetween(min, max) {
    return Math.random() * (max - min + 1) + min;
  }

  clamp(value, min, max) {
    var r_val = value;
    if (r_val > max) r_val = max;
    if (r_val < min) r_val = min;
    return r_val;
  }

  // TODO replace with a NN algotithm, d3 has quadtrees might be nice to use here
  findClosest(point, points) {
    var closest = Infinity;
    points.map(p => {
      var dist = Math.abs(this.euclideanDistance(p, point));
      if (dist !== 0 && dist < closest) closest = dist;
    });
    return closest;
  }
}
