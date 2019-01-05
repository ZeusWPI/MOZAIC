import * as React from 'react';

import * as M from '../../database/models';
import { WeakConfig } from './types';
import Section from './Section';
import { MapPreview, ImportMap } from './MapPreview';
import { remote } from 'electron';
import { Importer } from '../../utils/Importer';

import * as styles from './PlayPage.scss';

export interface ConfigProps {
  importMap: (mapMeta: M.MapMeta) => void;
  maps: M.MapList;
  setConfig(conf: WeakConfig): void;
}

export type ConfigState = WeakConfig & {};

export class Config extends React.Component<ConfigProps> {
  public state: ConfigState = {
    type: 'weak',
    mapId: undefined,
    maxTurns: 500,
    host: '127.0.0.1',
    port: 9142,
  };

  public render() {
    const { mapId, maxTurns, host, port } = this.state;
    const maps = Object.keys(this.props.maps).map((id) => this.props.maps[id]);
    const map = (mapId) ? this.props.maps[mapId] : undefined;

    return (
      <Section header={"Config"}>
        <MapSelector maps={maps} selectMap={this.selectMap} selectedMap={mapId} importMap={this.props.importMap} />
        <MaxTurnsField value={maxTurns} setMax={this.setMax} />
        <ServerAddressField value={host} setServer={this.setServer} />
        <PortField value={port} setPort={this.setPort} />
      </Section>
    );
  }
  private selectMap = (mapId: M.MapId) => this.setState({ mapId }, this.callBack);
  private setMax = (maxTurns: number) => this.setState({ maxTurns }, this.callBack);
  private setServer = (host: string) => this.setState({ host }, this.callBack);
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
  importMap: (mapMeta: M.MapMeta) => void;
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
      return <MapPreview selectedMap={map} selectMap={select} selected={map.uuid === selectedMap} key={i} />;
    });
    return (
      <div className={styles.mapSelector}>
        {options}
        <ImportMap importMap={this.importMap} />
      </div>
    );
  }

  private importMap = () => {
    remote.dialog.showOpenDialog({ properties: ["openFile", "showHiddenFiles"] }, (paths: string[]) => {
      Importer.importMapFromFile(paths[0])
        .then((mapMeta: M.MapMeta) => { this.props.importMap(mapMeta); });
    });
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
