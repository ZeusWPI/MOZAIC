const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const exec = require('child_process').exec;
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
  var code = req.body;
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
  config.log_file = "/tmp/test.log";

  fs.writeFile("/tmp/test.config", JSON.stringify(config), function(err){
    return console.log(err);
  });

  exec('./bot_driver /tmp/test.config', (err, stdout, stderr) => {
    if(err) {
      res.send(err);
    }
    console.log(`stdout: ${stdout}`);
    console.log(`stderr: ${stderr}`);

    fs.readFile('/tmp/test.log', 'utf8', function (err,data) {
      if (err) {
        return console.log(err);
      }
      res.send(data);
    });
  });
});

app.listen(3000, function () {
  console.log('Example app listening on port 3000!')
});
