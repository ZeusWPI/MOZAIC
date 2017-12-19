const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');

const Executor = require('./executor');

const app = express();

app.use(bodyParser.json());

const GAME_CONFIG_DEFAULT = {
  "map_file": "../maps/hex.json",
  "max_turns": 500
};

const BOT_MAP = "./bots";

// serve client
const client_dir = path.normalize(path.join(__dirname, '..', 'client'));
app.get('/', function(req, res) {
  res.sendFile(path.join(client_dir, 'index.html'));
});
app.use(express.static(client_dir));

app.post('/bot', function(req, res) {
  console.log("==================================")
  var code = req.body.code;
  var executor = new Executor();
  executor.writeCode(code);

  var name = req.body.name || "bert";
  var opponent = req.body.opponent || getRandomPlayer();
  var opponent = createOpponent(opponent);
  console.log(name, req.body.opponent);
  // Make sure names are unique for visualizer
  if (opponent.name === name) {
    opponent.name += "2";
  }

  // Shitty working deep clone cause i don't trust no js
  var game_config = JSON.parse(JSON.stringify(GAME_CONFIG_DEFAULT));
  game_config.player_map = {};
  game_config.player_map[name] = "player_1";
  game_config.player_map[opponent.name] = "player_2";


  var config = {
    players: [{
        name: name,
        command: 'node',
        args: ['../blockly/runner.js', executor.code_file]
      },
      {
        name: opponent.name,
        command: 'node',
        args: ['../blockly/runner.js', opponent.path]
      }
    ],
    game_config: game_config,
    log_file: executor.log_file
  };

  executor.writeConfig(config);

  executor.run((err, stdout, stderr) => {

    console.log(`stdout: ${stdout}`);
    console.log(`stderr: ${stderr}`);

    var winner = getWinnerFromBotDriverOutput(stdout);
    console.log("Winner: " + winner);
    if (winner && winner == name) {
      writeWinningBot(name, code)
    }

    if (err) {
      res.send(err);
      executor.clean();
      return;
    }

    fs.readFile(executor.log_file, (err, log) => {
      res.send(log);
      executor.clean();
    })

  });
});

app.get('/players', function(req, res) {
  fs.readdir(BOT_MAP, (err, files) => {
    players = files.map((file) => file.substring(0, file.length - 3));
    res.send({ 'players': players });
  });
});

function createOpponent(opponent) {
  return {
    "path": BOT_MAP + '/' + opponent + '.js',
    "name": opponent
  }
}

function getRandomPlayer() {
  var items = fs.readdirSync(BOT_MAP);
  var rand = items[Math.floor(Math.random() * items.length)];
  var name = rand.substr(0, rand.indexOf('.'));
  return name;
}

function getWinnerFromBotDriverOutput(output) {
  var lines = output.split('\n');
  var winners = lines[lines.length - 2];
  var winners_split = winners.split(/"/);
  console.log("Winners: ", winners_split)
  if (winners_split.length == 3) {
    return winners_split[1];
  } else {
    return null;
  }
}

app.listen(3000, function() {
  console.log('Example app listening on port 3000!');
});

function writeWinningBot(name, code) {
  var path = `${BOT_MAP}/${name}.js`
  fs.writeFileSync(path, code);
}
