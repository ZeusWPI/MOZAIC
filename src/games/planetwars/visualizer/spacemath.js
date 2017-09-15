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

    randomIntBetween(min, max) {
        return Math.floor(this.randomBetween(min, max));
      }
    
    randomBetween(min, max) {
        return Math.random() * (max - min + 1) + min;
    }
}