import * as React from 'react';
import { div, h, li, ul } from 'react-hyperscript-helpers';
import { IGameData } from '../../utils/GameModels';

interface IHistoryProps {
  expandedGameId: number;
  games: { id: number, game: IGameData }[];
}

interface IState { }

export default class History extends React.Component<IHistoryProps, IState> {
  public render() {
    const games = this.props.games.map((game) => div(["test"]));
    return div([
      ul([]),
    ]);
  }
}



// export default class History extends React.Component<HistoryProps, HistoryState>{
//   constructor(props:HistoryProps) {
//     super(props)
//     this.state = {
//       gameData: undefined
//     }
//   }
//   render() {
//     let games:path.ParsedPath[] = this.readGames()
//     let gamesElements:any = []

//     for (let game of games)
//     {
//       let gameAnalyser = GameAnalyser.parseGame(game.dir + "/" + game.base)
//       let gameData = gameAnalyser.getData()
//       gamesElements.push(h("li", `.${styles.gameElement}`, { onClick: (evt:any) => this.loadMatch(gameData)}, [ h(MatchEntry, { gameData: gameData} ), ]))
//     }
//     if (this.state.gameData)
//     {
//       return h("div", `.${styles.history}`, [
//         h("ul", `.${styles.leftPane}`, gamesElements),
//         h("div", `.${styles.rightPane}`, [
//           `Number of ships sent for player 1: ${this.state.gameData.shipsSent.reduce((a, b) => a + b[1], 0)}. `,
//           h("br"),
//           `Number of planets taken by player 1: ${this.state.gameData.planetsTaken[1]}`,
//           h(Visualizer, {gameLog: this.state.gameData.gameLog, playerData: { players: this.state.gameData.players }} )
//         ])
//       ])
//     } else {
//       return h("div", `.${styles.history}`, [
//         h("ul", `.${styles.leftPane}`, gamesElements),
//         h("div", `.${styles.rightPane}`, [])
//       ])
//     }
//   }
//   loadMatch(gameData:GameData) {
//     this.setState({ gameData: gameData })
//   }
//   readGames(): path.ParsedPath[] {
//     let dir = "./games"
//     if (fs.existsSync(dir)) {
//       let fileNames = fs.readdirSync(dir);
//       fileNames = fileNames.filter(file => fs.lstatSync("./games/" + file).isFile())
//       let paths = fileNames.map((f) => path.parse(path.resolve(dir, f)));
//       return paths;
//     }
//     return [];
//   }
// }
