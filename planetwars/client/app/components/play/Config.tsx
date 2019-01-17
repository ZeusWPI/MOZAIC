import * as React from 'react';

import * as M from '../../database/models';
import { WeakConfig } from './types';
import Section from './Section';
import { MapPreview, ImportMap } from './MapPreview';
import { remote } from 'electron';
import { Importer } from '../../utils/Importer';
import { PwConfig, Address } from '../../reducers/lobby';

import * as css from './PlayPage.scss';

export interface ConfigProps {
  maps: M.MapList;
  config: PwConfig;
  address: Address;
  serverRunning: boolean;
  setConfig: (config: PwConfig) => void;
  setAddress: (address: Address) => void;
  importMap: (mapMeta: M.MapMeta) => void;
}

export class Config extends React.Component<ConfigProps> {

  public render() {
    const { mapId, maxTurns, host, port } = this.state;
    const { address, config } = this.props;
    const maps = Object.keys(this.props.maps).map((id) => this.props.maps[id]);
    const map = (config.mapId) ? this.props.maps[config.mapId] : undefined;

    return (
      <Section header={"Config"}>
        <MapSelector
          maps={maps}
          selectMap={this.selectMap}
          selectedMap={config.mapId}
          importMap={this.props.importMap}
        />
        <MaxTurnsField value={config.maxTurns} setMax={this.setMax} />
        <ServerAddressField
          value={address.host}
          setServer={this.setServer}
          disabled={this.props.serverRunning}
        />
        <PortField
          value={address.port}
          setPort={this.setPort}
          disabled={this.props.serverRunning}
        />
      </Section>
    );
  }

  private selectMap = (mapId: M.MapId) => {
    const newConfig = {... this.props.config, mapId };
    this.props.setConfig(newConfig);
  }

  private setMax = (maxTurns: number) => {
    const newConfig = {...this.props.config, maxTurns };
    this.props.setConfig(newConfig);
  }

  private setServer = (host: string) => {
    const newAddress = { ...this.props.address, host };
    this.props.setAddress(newAddress);
  }

  private setPort = (port: number) => {
    const newAddress = { ...this.props.address, port };
    this.props.setAddress(newAddress);
  }
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

export interface ServerAddressProps {
  value: string;
  setServer: (val: string) => void;
  disabled: boolean;
}

export const ServerAddressField: React.SFC<ServerAddressProps> = (props) => {
  return (
    <HorizontalInput label="Address" id="address">
      <input
        className="input"
        type="text"
        value={props.value}
        disabled={props.disabled}
        // tslint:disable-next-line:jsx-no-lambda
        onChange={(evt: any) => props.setServer(evt.target.value)}
      />
    </HorizontalInput>
  );
};

export interface PortProps {
  value: number;
  setPort: (val: number) => void;
  disabled: boolean;
}

export const PortField: React.SFC<PortProps> = (props) => {
  return (
    <HorizontalInput label="Port" id="port">
      <input
        className="input"
        type="number"
        placeholder="9142"
        disabled={props.disabled}
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
      <div className={css.mapSelector}>
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
