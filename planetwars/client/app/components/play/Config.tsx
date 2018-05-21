import * as React from 'react';
import * as fs from 'fs';

import * as M from '../../database/models';
import { WeakConfig } from './types';
import Section from './Section';
import { MapViewGraph, GraphProps, MapViewData, StaticPlanet } from './MapPreview';
import { JsonPlanet } from '../../database/migrationV3';

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
        <MapPreview selectedMap={map} />
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

    const options = maps.map((map, i) => (
      <option value={map.uuid} key={map.uuid}>
        {map.name} ({map.slots})
      </option>
    ));
    return (
      <HorizontalInput id={"map"} label={"Map"}>
        <div className="select">
          <select name="Maps" id="maps" onChange={this.onChange}>
            {options}
          </select>
        </div>
      </HorizontalInput>);
  }
  private onChange = (evt: any) => this.props.selectMap(evt.target.value);
}

export interface MapPreviewProps {
  selectedMap?: M.MapMeta;
}

export interface MapPreviewState {
  map?: M.GameMap | Error;
}

export class MapPreview extends React.Component<MapPreviewProps, MapPreviewState> {

  constructor(props: MapPreviewProps) {
    super(props);
    this.state = {
      map: undefined,
    }
  }

  public componentDidMount() { this.update(this.props); }

  public componentDidUpdate(prevProps: MapPreviewProps) {
    const meta = this.props.selectedMap;
    const prev = prevProps.selectedMap;
    if (!meta) { this.setState({ map: undefined }); return; }
    if (!prev) { this.update(this.props); return; }
    if (meta.uuid === prev.uuid) { return; }
    this.update(this.props);
  }

  public render() {
    const planets = M.isGameMap(this.state.map) ?
                    this.state.map.planets.map((planet: JsonPlanet, index: number) => {
                      return { 
                        ...planet,
                        index,
                      }
                    }) :
                    [];
    let minmax = {min: {x: Infinity, y:Infinity}, max: {x: -Infinity, y: -Infinity}}
    planets.forEach((planet: StaticPlanet) => {
      minmax = {
        min: {x: Math.min(minmax.min.x, planet.x), y: Math.min(minmax.min.y, planet.y)},
        max: {x: Math.max(minmax.max.x, planet.x), y: Math.max(minmax.max.y, planet.y)},
      }
    });
    // TODO: Add preview code here, state can be undefined, a map, or an error;
    const data: MapViewData = {
      planets: planets,
      ...minmax,
    }

    return (
      <div className={styles.mapPreview}>
        <div className={styles.map}>
          <MapViewGraph data={data} width={100} height={100} />
        </div>
      </div>
    );
  }

  private update(props: MapPreviewProps) {
    const meta = this.props.selectedMap;
    if (!meta) { this.setState({ map: undefined }); return; }

    fs.readFile(meta.mapPath, (err, data) => {
      if (err) { this.setState({ map: err }); return; }
      try {
        const input = JSON.parse(data.toString());
        const map = M.isGameMap(input) ? input : new Error('Map is not valid');
        this.setState({ map });
      } catch (err) {
        this.setState({ map: err });
      }
    });
  }
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
