const temp = require('temp');
const fs = require('fs');
const { exec } = require('child_process');

const BOT_DRIVER_PATH = './bot_driver';

class Executor {
  constructor(player) {
    if (!player) {
      
    }
    this.config_file = temp.path({suffix: '.json'});
    this.code_file = temp.path({suffix: '.js'});
    this.log_file = temp.path({suffix: '.log'});
  }

  writeCode(code) {
    fs.writeFileSync(this.code_file, code);
  }

  writeConfig(config) {
    fs.writeFileSync(this.config_file, JSON.stringify(config));
  }
   
  run(callback) {
    exec(BOT_DRIVER_PATH + ' ' + this.config_file, callback);
  }

  // remove temp files
  clean() {
    fs.unlinkSync(this.config_file);
    fs.unlinkSync(this.code_file);
    fs.unlinkSync(this.log_file);
  }
}

module.exports = Executor;
