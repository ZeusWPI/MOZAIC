import * as React from 'react';
import BotsList from '../BotsList';
import * as path from "path";
import * as fs from "fs";

import {h} from "react-hyperscript-helpers";
import {connect} from "react-redux";
import {IState} from "../../../reducers";
import {botsRerender} from "../../../actions/actions";
import {readBotFilesAsNames} from "../helpers/BotFileManager";


const mapStateToProps = (state: IState) => {
  return {
    bots: state.botpage.bots
  }
};

const mapDispatchToProps = (dispatch: any) => {
  return {
    rerender: () => {
      let bots: string[] = readBotFilesAsNames();
      dispatch(botsRerender(bots))
    }
  }

};



export default connect(mapStateToProps, mapDispatchToProps)(BotsList)

