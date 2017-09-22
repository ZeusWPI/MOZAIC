const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');

const Executor = require('./executor');

const app = express();

app.use(bodyParser.text());

var game_config = {
    "player_map": {
        "bert": "player_1",
        "timp": "player_2"
    },
    "map_file": "../maps/hex.json",
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
  console.log(req.body);
  executor.writeCode(req.body);
  
  var config = {
    players: [
      {
        name: 'bert',
        command: 'python3',
        args: ['../bots/simplebot/simple.py']
      },
      {
        name: 'timp',
        command: 'node',
        args: ['../blockly/runner.js', executor.code_file]
      }
    ],
    game_config: game_config,
    log_file: executor.log_file
  };
  console.log(JSON.stringify(config));

  executor.writeConfig(config);

  executor.run((err, stdout, stderr) => {
    console.log(`stdout: ${stdout}`);
    console.log(`stderr: ${stderr}`);
    if (err) {
      res.send(err);
      executor.clean();
    } else {
      res.sendFile(executor.log_file, e => {
        executor.clean();
      });
    }
  });
});


app.listen(3000, function () {
  console.log('Example app listening on port 3000!');
});
