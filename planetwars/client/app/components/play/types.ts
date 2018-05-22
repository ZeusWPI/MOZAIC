import * as M from '../../database/models';

export function validateConfig(conf?: WeakConfig): StrongConfig | ValidationError {
  if (!conf) { return { msg: 'Please fill in config.', type: 'error' }; }
  const { selectedMap, maxTurns, host, port } = conf;
  const address = { host, port };
  if (!selectedMap) { return { map: 'Please select a map.', type: 'error' }; }
  return { type: 'strong', map: selectedMap, maxTurns, address };
}

export function exportConfig(conf: StrongConfig, maps: M.MapList): ServerGameConfig {
  return {
    map_file: maps[conf.map].mapPath,
    max_turns: conf.maxTurns,
  };
}

export function downGrade(conf: StrongConfig): WeakConfig {
  const { map, maxTurns, address: { host, port } } = conf;
  return { type: 'weak', selectedMap: map, maxTurns, host, port };
}

export function getWeakAddress(conf: WeakConfig | StrongConfig | undefined): { port?: number, host?: string } {
  if (!conf) { return {}; }
  if (conf.type === 'strong') { return conf.address; }
  const { port, host } = conf;
  return { port, host };
}

// TODO: Move outta here
export interface ValidationError {
  type: 'error'; // Cause runtime typechecking // I should really fix something better
  msg?: string;
  map?: string;
  maxTurns?: string;
  address?: string;
}

// Config that might contain invalid values
export interface WeakConfig {
  type: 'weak';
  selectedMap?: M.MapId;
  maxTurns: number;
  host: string;
  port: number;
}

export interface StrongConfig {
  type: 'strong';
  map: M.MapId;
  maxTurns: number;
  address: M.Address;
}

export interface ServerGameConfig {
  map_file: string;
  max_turns: number;
}
