Interpreter = require('js-interpreter');

class CodeInjector {
  constructor(interpreter, scope) {
    this.interpreter = interpreter;
    this.scope = scope;
  }

  inject(fun_name, fun) {
    var native_fun = interpreter.createNativeFunction(fun);
    interpreter.setProperty(scope, fun_name, native_fun);
  }

  inject_planetwars(pw) {
    this.inject('getPlayer', () => pw.getPlayer());
    this.inject('getPlayers', () => pw.getPlayers());
    this.inject('getPlanets', () => pw.getPlanets());
    this.inject('getExpeditions', () => pw.getExpeditions());
    this.inject('getPlanet', (name) => pw.getPlanet(name));
    this.inject('distance', (p1, p2) => pw.distance(p1, p2));
    this.inject('dispatch', (n, o, t) => pw.dispatch(n, o, t));
  }
}


