export function toRadians(angle: number) {
  return angle * (Math.PI / 180);
}

export function toDegrees(angle: number) {
  return angle * (180 / Math.PI);
}

export type Point = { x: number, y: number };
export function euclideanDistance(e1: Point, e2: Point) {
  return Math.sqrt(Math.pow(e1.x - e2.x, 2) + Math.pow(e1.y - e2.y, 2));
}

export function manhattanDistance(p1: Point, p2: Point) {
  return p1.x - p2.x + p1.y - p2.y;
}

export function randomIntBetween(min: number, max: number) {
  return Math.floor(randomBetween(min, max));
}

export function randomBetween(min: number, max: number) {
  return Math.random() * (max - min + 1) + min;
}

export function clamp(value: number, min: number, max: number) {
  let rVal = value;
  if (rVal > max) { rVal = max; }
  if (rVal < min) { rVal = min; }
  return rVal;
}

// TODO replace with a NN algorithm, d3 has quadtrees might be nice to use here
export function findClosest(point: Point, points: Point[]) {
  let closest = Infinity;
  points.map((p) => {
    const dist = Math.abs(euclideanDistance(p, point));
    if (dist !== 0 && dist < closest) { closest = dist; }
  });
  return closest;
}
