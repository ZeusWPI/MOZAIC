import { actionCreatorVoid, actionCreator } from './helpers';
import { BotConfig } from '../utils/Models';
export const plusOne = () => {
  return {
    type: 'TEST'
  }
}

export const gameStarted = () => {
  return {
    type: 'gameStarted'
  }
}


export const gameFinished = () => {
  return {
    type: 'gameFinished'
  }
}

export const gameCrashed = () => {
  return {
    type: 'gameCrashed'
  }
}

export const botsRerender = (bots: string[]) => {
  return {
    type: 'botsRerender',
    bots: bots
  }
}



export const toggleNavMenu = actionCreatorVoid('TOGGLE_NAV_MENU');
export const incrementAbout = actionCreatorVoid('TEST');
export const loadBot = actionCreator<BotConfig>('LOAD_BOT');
export const removeBot = actionCreator<string>('REMOVE_BOT');