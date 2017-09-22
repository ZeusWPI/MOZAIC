const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const exec = require('child_process').exec;
const temp = require('temp');
const path = require('path');

const app = express();
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
  var code_file = temp.path({suffix: '.js'});
  var log_file = temp.path({suffix: '.log'});
  var config_file = temp.path({suffix: '.json'});
  
  var code = req.body;
  
  fs.writeFile(code_file, code, function(err){
    return console.log(err);
  });

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
  config.log_file = log_file;

  fs.writeFile(config_file, JSON.stringify(config), function(err){
    return console.log(err);
  });

  exec('./bot_driver ' + config_file, (err, stdout, stderr) => {
    if(err) {
      res.send(err);
    }
    console.log(`stdout: ${stdout}`);
    console.log(`stderr: ${stderr}`);

    fs.readFile(log_file, 'utf8', function (err,data) {
      if (err) {
        return console.log(err);
      }
      res.send(data);
    });

    fs.unlink(code_file);
    fs.unlink(log_file);
    fs.unlink(config_file);
  });
});

app.listen(3000, function () {
  console.log('Example app listening on port 3000!');
});
