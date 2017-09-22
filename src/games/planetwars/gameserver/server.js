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
  
  var executor = new Executor();
  executor.writeCode(req.body);
  
  var config = {
    players: [
      {
        name: 'bert',
        command: 'python3',
        args: [] // TODO
      },
      {
        name: 'player',
        command: 'node',
        args: [executor.code_file]
      }
    ],
    game_config,
    log_file: executor.log_file
  };

  executor.writeConfig(config);

  // TODO: handle error
  executor.run();
  res.sendFile(executor.log_file);
  executor.clean();
});

class Executor {
  constructor() {
    this.config_file = temp.path({suffix: '.json'});
    this.code_file = temp.path({suffix: '.js'});
    this.log_file = temp.path({suffix: '.log'});
  }

  writeCode(code) {
    fs.writeFile(this.code_file, code, err => {
      console.log(err);
    });
  }

  writeConfig(config) {
    fs.writeFile(this.config_file, JSON.stringify(config), err => {
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
