import * as React from 'react';
import BotsList from '../BotsList';
import * as path from "path";
import * as fs from "fs";

import {h} from "react-hyperscript-helpers";
import {connect} from "react-redux";
import {RootState} from 'redux'


const mapStateToProps = (state: RootState) => {

}

const mapDispatchToProps = dispatch => {

}



const bots = readBots().map((x: path.ParsedPath) => x.name);

function readBots(): path.ParsedPath[] {
  let dir = "./bots";
  if (fs.existsSync(dir)) {
    let fileNames = fs.readdirSync(dir);
    fileNames = fileNames.filter(file => fs.lstatSync("./bots/" + file).isFile());
    let paths = fileNames.map((f) => path.parse(path.resolve(dir, f)));
    return paths;
  }
  return [];
}

export default connect(mapStateToProps, mapDispatchToProps)(BotsList)

