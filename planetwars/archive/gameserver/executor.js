const temp = require('temp');
const fs = require('fs');
const { exec } = require('child_process');
const mozaic = require("mozaic-client");
const { createWriteStream } = require("fs");

const BOT_DRIVER_PATH = './bot_driver';

class Executor {
  constructor(player) {
    const addr = {
      host: "127.0.0.1",
      port: 9142
    };

    this.code_file = temp.path({suffix: '.js'});
    this.log_file = temp.path({suffix: '.log'});

    console.log("Starting ServerControl with", {
      ...addr,
      token: Buffer.from("abba", "hex"),
    })

    this.serverControl = new mozaic.ServerControl({
      ...addr,
      token: Buffer.from("abba", "hex"),
    })

    this.serverControl.connect();
  }

  writeCode(code) {
    code = code || ""
    const code_file = this.code_file;
    fs.readFile("../template.js", 'utf8', function (err,data) {
      if (err) {
        return console.log(err);
      }
      var result = data.replace(/CODEHEREPLZ/g, code);

      console.log("Writing code to " + code_file)

      fs.writeFile(code_file, result, 'utf8', function (err) {
        if (err) return console.log(err);
      });
    });
  }

  setPlayers(players) {
    this.players = players;
  }
   
  run(callback) {
    const ownerToken = Buffer.from('cccc', 'hex');
    let matchUuid;

    console.log("Creating match with ownerToken ", ownerToken)

    this.serverControl.createMatch(ownerToken).then((e) => {
      matchUuid = e.matchUuid;
      console.log("Got uuid ", matchUuid)
    }).then(() => {
      this.runMatch(matchUuid, ownerToken, callback);
    })
  }

  runMatch(matchUuid, ownerToken, callback) {
    const addr = {
      host: "127.0.0.1",
      port: 9142
    };

    console.log("logging to ", this.log_file)

    const logStream = createWriteStream(this.log_file);

    console.log("Starting PwMatch with", {
      host: addr.host,
      port: addr.port,
      token: ownerToken,
      matchUuid,
    })

    const match = new mozaic.PwMatch({
      host: addr.host,
      port: addr.port,
      token: ownerToken,
      matchUuid,
    }, new mozaic.Logger(0, logStream))

    console.log("Created match")

    const clients = {};
    const waiting_for = new Set();

    match.client.on(mozaic.events.Connected, (_) => {
      console.log("Match connected")
      this.players.forEach((player, idx) => {
        console.log("Connecting player ", player)
          const player_num = idx + 1;
          waiting_for.add(player_num);
          const token = Buffer.from(player.token, 'hex');
          match.createClient(token).then(({ clientId }) => {
              const client = new mozaic.PwClient({
                  clientId: clientId,
                  token,
                  matchUuid,
                  host: addr.host,
                  port: addr.port,
                  botConfig: this.players[clientId-1].botConfig,
                  logSink: logStream,
              });
              clients[clientId] = client;
              client.run();
  
          });
      })
    });

    match.on(mozaic.events.ClientConnected).subscribe(({ clientId }) => {
      console.log("Player " + clientId + " connected")
      waiting_for.delete(clientId);
      if (waiting_for.size == 0) {
        console.log("Starting Game")
        match.send(mozaic.events.StartGame.create({
          mapPath: "../planetwars/maps/hex.json",
          maxTurns: 100,
        }));
      }
    });

    match.on(mozaic.events.ClientDisconnected).subscribe(({ clientId }) => {
      console.log("Player " + clientId + " disconnected")
    });

    match.on(mozaic.events.GameFinished).subscribe(() => {
      console.log("calling callback")
      callback()
    })

    match.connect();
  }

  // remove temp files
  clean() {
    // What temp files?
    // fs.unlinkSync(this.code_file);
    // fs.unlinkSync(this.log_file);
  }
}

module.exports = Executor;
