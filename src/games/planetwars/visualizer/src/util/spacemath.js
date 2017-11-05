class SpaceMath {
  static toRadians(angle) {
    return angle * (Math.PI / 180);
  }

  static toDegrees(angle) {
    return angle * (180 / Math.PI);
  }

  static euclideanDistance(e1, e2) {
    return Math.sqrt(Math.pow(e1.x - e2.x, 2) + Math.pow(e1.y - e2.y, 2));
  }

  static manhattenDistance(p1, p2) {
    return p1.x - p2.x + p1.y - p2.y;
  }

  static randomIntBetween(min, max) {
    return Math.floor(this.randomBetween(min, max));
  }

  static randomBetween(min, max) {
    return Math.random() * (max - min + 1) + min;
  }

  static clamp(value, min, max) {
    var r_val = value;
    if (r_val > max) r_val = max;
    if (r_val < min) r_val = min;
    return r_val;
  }

  // TODO replace with a NN algotithm, d3 has quadtrees might be nice to use here
  static findClosest(point, points) {
    var closest = Infinity;
    points.map(p => {
      var dist = Math.abs(this.euclideanDistance(p, point));
      if (dist !== 0 && dist < closest) closest = dist;
    });
    return closest;
  }
}

module.exports = {
  SpaceMath
}