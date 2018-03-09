import * as React from 'react';
import BotsList  from '../BotsList';
import * as path from "path";
import * as fs from "fs";
import * as Promise from 'bluebird'
import {h} from "react-hyperscript-helpers";
import {connect} from "react-redux";
import {BotsState} from "../../../reducers";
import {loadBot} from "../../../actions/actions";
import {ObjectManager} from "../../../utils/ObjectManager";
import {BotConfig} from "../../../utils/Models";


const mapStateToProps = (state: BotsState) => {
  return {
    bots: state.bots
  }
};

const mapDispatchToProps = (dispatch: any) => {
  return {
    refreshBots: () : Promise<void> => {
      return ObjectManager.loadBots()
        .map((bot: BotConfig) => dispatch(loadBot(bot)))
        .all()
        .then( () => Promise.resolve());
    }
  }

};



export default connect(mapStateToProps, mapDispatchToProps)(BotsList)

