/**
 * Houses a player lobby, map settings, and bot assignment (to players).
 * The gameserver is started from here, after which a game can be launched.
 * 
 */
/** */
import { connect } from 'react-redux';
import * as React from 'react';

interface PlayPageDispatchProps {

}

interface PlayPageStateProps {

}

type PlayPageProps = PlayPageDispatchProps & PlayPageStateProps;

@connect(
  (state) => ({}),
  (state) => ({}),
)
export default class PlayPage extends React.Component<PlayPageProps, {}> {
  public render() {
    return <p>test</p>;
  }
}
