const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const exec = require('child_process').exec;
const temp = require('temp');
const path = require('path');

const app = express();
const BOT_DRIVER_PATH = './bot_driver';
app.use(bodyParser.text());

var game_config = {
    "player_map": {
        "bert": "player_1",
        "timp": "player_2"
    },
    "map_file": "../games/planetwars/maps/hex.json",
    "max_turns": 500
};

// serve client
const client_dir = path.normalize(path.join(__dirname, '..', 'client'));
app.get('/',function(req,res){
  res.sendFile(path.join(client_dir, 'index.html'));
});
app.use(express.static(client_dir));

app.post('/bot', function(req, res) {
  //var code = JSON.parse(req.body).code;
  
  var code = req.body;
  
  var config = {};
  config.players = [];
  
  var player1 = {
      "name": "bert",
      "command": "python3",
      "args": [code_file]
  };

  var player2 = {
    "name": "timp",
    "command": "python3",
    "args": [code_file]
  };

  config.players.push(player1);
  config.players.push(player2);
  config.game_config = game_config;

  // TODO: handle error
  var executor = new Executor(config, code);
  executor.run();
  res.sendFile(executor.log_file);
  executor.clean();
});

class Executor {
  constructor(config, code) {
    this.config_file = temp.path({suffix: '.json'});
    this.code_file = temp.path({suffix: '.js'});
    this.log_file = temp.path({suffix: '.log'});

    // inject log file
    config.log_file = this.log_file;

    fs.writeFile(this.config_file, JSON.stringify(config), err => {
      console.log(err);
    });
    fs.writeFile(this.code_file, code, err => {
      console.log(err);
    });
  }

  run() {
    exec(BOT_DRIVER_PATH + ' ' + this.config_file, (err, stdout, stderr) => {
      console.log(`stdout: ${stdout}`);
      console.log(`stderr: ${stderr}`);
      return err;
    });
  }

  // remove temp files
  clean() {
    fs.unlink(this.config_file);
    fs.unlink(this.code_file);
    fs.unlink(this.log_file);
  }
}

app.listen(3000, function () {
  console.log('Example app listening on port 3000!');
});
