import * as M from '../../database/models';

export function validateConfig(conf?: WeakConfig): StrongConfig | ValidationError {
  if (!conf) { return { msg: 'Please fill in config.' }; }
  const { selectedMap, maxTurns, serverAddress, port } = conf;
  const address = { host: serverAddress, port };
  if (!selectedMap) { return { map: 'Please select a map.' }; }
  return { map: selectedMap, maxTurns, address };
}

// TODO: Move outta here
export interface ValidationError {
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
