const readline = require('readline');
const eval_code = require('./src/eval_code');
const PlanetWars = require('./src/planetwars');

const fs = require('fs');

const data_file = process.argv[2];
const player_name = process.argv[3];

// read code
fs.readFile(data_file, 'utf8', function(err, code) {
  if (err) {
    console.log(err);
  } else {
    run_bot(code);
  }
});

function run_bot(code) {
  var rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: false
  });

  rl.on('line', function(line){
    let state = JSON.parse(line);
    let pw = new PlanetWars(player_name, state);
    eval_code(code, pw);
    let command = { moves: pw.dispatches };
    console.log(JSON.stringify(command));
  });
}
