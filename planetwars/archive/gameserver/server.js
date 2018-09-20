const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const crypto = require("crypto");

const Executor = require('./executor');

const app = express();

app.use(bodyParser.json());

app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

const GAME_CONFIG_DEFAULT = {
  "map_file": "../maps/hex.json",
  "max_turns": 500
};

const BOT_MAP = "./bots";
var executor = new Executor();

// serve client
const client_dir = path.normalize(path.join(__dirname, '..', 'client'));
app.get('/', function(req, res) {
  res.sendFile(path.join(client_dir, 'index.html'));
});
app.use(express.static(client_dir));

app.post('/bot', function(req, res) {
  console.log("==================================")
  var code = req.body.code;
  executor.writeCode(code);

  var name = req.body.name || "bert";
  var opponent = req.body.opponent || getRandomPlayer();
  var opponent = createOpponent(opponent);
  console.log(name, opponent);
  // Make sure names are unique for visualizer
  if (opponent.name === name) {
    opponent.name += "2";
  }

  // Shitty working deep clone cause i don't trust no js
  var game_config = JSON.parse(JSON.stringify(GAME_CONFIG_DEFAULT));
  game_config.player_map = {};
  game_config.player_map[name] = "player_1";
  game_config.player_map[opponent.name] = "player_2";

  const players = [
      {
        name: name,
        token: crypto.randomBytes(16).toString('hex'),
        botConfig: {
          command: "node",
          args: [executor.code_file],
        },
        number: 1,
      },
      {
        name: opponent.name,
        token: crypto.randomBytes(16).toString('hex'),
        botConfig: {
          command: "node",
          args: [opponent.path],
        },
        number: 2,
      }
  ];

  console.log("Players are ", players)

  // var config = {
  //   players: [{
  //       name: name,
  //       command: 'node',
  //       args: ['../blockly/runner.js', executor.code_file]
  //     },
  //     {
  //       name: opponent.name,
  //       command: 'node',
  //       args: ['../blockly/runner.js', opponent.path]
  //     }
  //   ],
  //   game_config: game_config,
  //   log_file: executor.log_file
  // };

  executor.setPlayers(players);

  executor.run(() => {
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
