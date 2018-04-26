import * as React from "react";

// tslint:disable-next-line:no-var-requires
const styles = require("./Join.scss");

export interface JoinStateProps {

}

export interface JoinDispatchProps {

  join: (config: any) => void

}


export type JoinProps = JoinStateProps & JoinDispatchProps;

export interface JoinState {
  hostName: string;
  token: string;
}


export class Join extends React.Component<JoinProps, JoinState> {

  public state: JoinState = {hostName: '', token: ''};

  public render () {
    const setHost = (evt: any) => {

      this.setHostName(evt.target.value);

    };
    const setToken = (evt: any) => {
      this.setToken(evt.target.value);
    };

    const joinGame = () => {
      this.joinGame();
    };

    return (
      <div className={styles.joinPage}>
        <div className={styles.inputField}>
          <span className={styles.jointitle}>Hostname</span>
          <input type="text" onBlur={setHost}/>
        </div>

        <div className={styles.inputField}>
          <span className={styles.jointitle}>Token</span>
          <input type="text" onBlur={setToken}/>
        </div>

        <button type="button" onClick={joinGame}>Join</button>


      </div>
    );
  }

  private setHostName (name: string) {

    this.setState({
      ...this.state,
      hostName: name
    });

  }

  private setToken (token: string) {

    this.setState({
      ...this.state,
      token: token
    });

  }

  private joinGame () {
    let config = {

      hostName: this.state.hostName,
      token: this.state.token
    };

    this.props.join(config);
  }


}
