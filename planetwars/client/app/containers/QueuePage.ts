
import { IState } from "../reducers";
import Queue from "../components/Queue"
import {connect} from "react-redux";

const gameA =  {
  gameID: 1,
  players: ['player1', 'player2'],
  numTurns: 7
};

const gameB= {
  gameID: 2,
  players: ['player3', 'player4'],
  numTurns: 8
};

const mapStateToProps = (state: IState) => {
  return {
    runningGames: [gameA, gameB]

  }
};


const mapDispatchToProps = (dispatch: Function) => {
  return {

  }
};

export default connect(mapStateToProps, mapDispatchToProps)(Queue)
