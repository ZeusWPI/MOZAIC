import * as React from 'react';

import * as M from '../../database/models';
import { WeakConfig } from './types';
import Section from './Section';
import { MapPreview } from './MapPreview';

// tslint:disable-next-line:no-var-requires
const styles = require('./PlayPage.scss');

export interface ConfigProps {
  maps: M.MapList;
  setConfig(conf: WeakConfig): void;
}

export type ConfigState = WeakConfig & {};

export class Config extends React.Component<ConfigProps> {
  public state: ConfigState = {
    selectedMap: undefined,
    maxTurns: 500,
    serverAddress: 'localhost',
    port: 9142,
  };

  public render() {
    const { selectedMap, maxTurns, serverAddress, port } = this.state;
    const maps = Object.keys(this.props.maps).map((id) => this.props.maps[id]);
    const map = (selectedMap) ? this.props.maps[selectedMap] : undefined;

    return (
      <Section header={"Config"}>
        <MapSelector maps={maps} selectMap={this.selectMap} selectedMap={selectedMap} />
        <MaxTurnsField value={maxTurns} setMax={this.setMax} />
        <ServerAddressField value={serverAddress} setServer={this.setServer} />
        <PortField value={port} setPort={this.setPort} />
      </Section>
    );
  }
  private selectMap = (selectedMap: M.MapId) => this.setState({ selectedMap }, this.callBack);
  private setMax = (maxTurns: number) => this.setState({ maxTurns }, this.callBack);
  private setServer = (serverAddress: string) => this.setState({ serverAddress }, this.callBack);
  private setPort = (port: number) => this.setState({ port }, this.callBack);
  private callBack = () => this.props.setConfig(this.state);
}

export interface MaxTurnProps { value: number; setMax(val: number): void; }
export const MaxTurnsField: React.SFC<MaxTurnProps> = (props) => {
  return (
    <HorizontalInput label="Max turns" id="maxTurns">
      <input
        className="input"
        type="number"
        placeholder="500"
        value={props.value}
        // tslint:disable-next-line:jsx-no-lambda
        onChange={(evt: any) => props.setMax(evt.target.value)}
      />
    </HorizontalInput>
  );
};

export interface ServerAddressProps { value: string; setServer(val: string): void; }
export const ServerAddressField: React.SFC<ServerAddressProps> = (props) => {
  return (
    <HorizontalInput label="Address" id="address">
      <input
        className="input"
        type="text"
        placeholder="localhost"
        value={props.value}
        // tslint:disable-next-line:jsx-no-lambda
        onChange={(evt: any) => props.setServer(evt.target.value)}
      />
    </HorizontalInput>
  );
};

export interface PortProps { value: number; setPort(val: number): void; }
export const PortField: React.SFC<PortProps> = (props) => {
  return (
    <HorizontalInput label="Port" id="port">
      <input
        className="input"
        type="number"
        placeholder="9142"
        value={props.value}
        // tslint:disable-next-line:jsx-no-lambda
        onChange={(evt: any) => props.setPort(evt.target.value)}
      />
    </HorizontalInput>
  );
};

export interface MapSelectorProps {
  maps: M.MapMeta[];
  selectedMap?: M.MapId;
  selectMap(id: M.MapId): void;
}

export class MapSelector extends React.Component<MapSelectorProps> {
  constructor(props: MapSelectorProps) {
    super(props);
    const { maps, selectMap } = props;
    if (maps[0]) { selectMap(maps[0].uuid); }
  }

  public render() {
    const { maps, selectedMap, selectMap } = this.props;
    let select;

    const options = maps.map((map, i) => {
      select = () => selectMap(map.uuid);
      return <MapPreview selectedMap={map} selectMap={select} selected={map.uuid === selectedMap} key={i}/>;
    });
    return (
      <div className={styles.mapSelector}>
        {options}
      </div>
    );
  }
  private onChange = (evt: any) => this.props.selectMap(evt.target.value);
}

export interface InputProps { id: string; label: string; }
export const HorizontalInput: React.SFC<InputProps> = (props) => {
  return (
    <div className="field is-horizontal">
      <div className="field-label">
        <label htmlFor={props.id} className="label">{props.label}</label>
      </div>
      <div className="field-body">
        <div className="field">
          <div className="control">
            {props.children}
          </div>
        </div>
      </div>
    </div>);
};
