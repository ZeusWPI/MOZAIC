const readline = require('readline');
const eval_code = require('./src/eval_code');
const PlanetWars = require('./src/planetwars');


var rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  terminal: false
});

let player_name = process.argv[2];
let pw = new PlanetWars(player_name);

rl.on('line', function(line){
  let state = JSON.parse(line);
  pw.setState(state);
  eval_code('', pw);
  console.log(JSON.stringify(pw.dispatches));
});


