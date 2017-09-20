const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');

const app = express()
app.use(bodyParser.text())

var game_config = {
    "player_map": {
        "bert": "player_1",
        "timp": "player_2"
    },
    "map_file": "../games/planetwars/maps/hex.json",
    "max_turns": 500
}

app.get('/', function (req, res) {
  res.send('Hello World!');
});

app.post('/bot', function(req, res) {
  //var code = JSON.parse(req.body).code;
  var code = req.body;
  console.log(code);
  fs.writeFile("/tmp/test.code", code, function(err){
    return console.log(err);
  });

  var config = {};
  config.players = [];
  
  var player1 = {
      "name": "bert",
      "command": "python3",
      "args": ["/tmp/test.code"]
  };

  var player2 = {
    "name": "timp",
    "command": "python3",
    "args": ["/tmp/test.code"]
  };

  config.players.push(player1);
  config.players.push(player2);
  config.game_config = game_config;

  fs.writeFile("/tmp/test.config", JSON.stringify(config), function(err){
    return console.log(err);
  });

  res.send('Bot uploaded!');
});

app.listen(3000, function () {
  console.log('Example app listening on port 3000!')
});

