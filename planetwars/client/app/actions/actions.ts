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

export const removeBot = (name: string, evt:any) => {
  return {
    type: 'removeBot',
    name: name,
    evt: evt
  }

}
