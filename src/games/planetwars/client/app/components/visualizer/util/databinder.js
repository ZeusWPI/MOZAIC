class DataBinder {
  constructor(initial) {
    this.value = initial;
    this.callbacks = [];
  }

  registerCallback(callback) {
    this.callbacks.push(callback);
  }

  update(value) {
    this.value = value;
    this._propagate();
  }

  _propagate() {
    this.callbacks.forEach(c => c(this.value));
  }
}

module.exports = {
    DataBinder
}