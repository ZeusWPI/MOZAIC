Interpreter = require('js-interpreter');

class CodeInjector {
  constructor(interpreter, scope) {
    this.interpreter = interpreter;
    this.scope = scope;
  }

  inject_function(fun_name, fun) {
    var native_fun = this.interpreter.createNativeFunction(fun);
    this.interpreter.setProperty(this.scope, fun_name, native_fun);
  }

  inject(obj) {
    Object.entries(obj).forEach(([name, fun]) => {
      this.inject_function(name, fun);
    });
  }
}

module.exports = CodeInjector;
