import * as M from '../../database/models';

export function validateConfig(conf?: WeakConfig): StrongConfig | ValidationError {
  if (!conf) { return { msg: 'Please fill in config.', isError: true }; }
  const { selectedMap, maxTurns, serverAddress, port } = conf;
  const address = { host: serverAddress, port };
  if (!selectedMap) { return { map: 'Please select a map.', isError: true }; }
  return { map: selectedMap, maxTurns, address };
}

export function hasErrored(o: StrongConfig | ValidationError): o is ValidationError {
  return (o as ValidationError).isError;
}

export function exportConfig(conf: StrongConfig, maps: M.MapList): ServerGameConfig {
  return {
    map_file: maps[conf.map].mapPath,
    max_turns: conf.maxTurns,
  };
}

export function downGrade(conf: StrongConfig): WeakConfig {
  const { map, maxTurns, address: { host, port } } = conf;
  return { selectedMap: map, maxTurns, serverAddress: host, port };
}

// TODO: Move outta here
export interface ValidationError {
  isError: true; // Cause runtime typechecking // I should really fix something better
  msg?: string;
  map?: string;
  maxTurns?: string;
  address?: string;
}

// Config that might contain invalid values
export interface WeakConfig {
  selectedMap?: M.MapId;
  maxTurns: number;
  serverAddress: string;
  port: number;
}

export interface StrongConfig {
  map: M.MapId;
  maxTurns: number;
  address: M.Address;
}

export interface ServerGameConfig {
  map_file: string;
  max_turns: number;
}
