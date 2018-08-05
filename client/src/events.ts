import * as protocol_root from './proto';
const event_types = require('./event_types');
const events = protocol_root.mozaic.events;

// here we dynamically attach a type id to all known event names.
// this is not really ideal, a more static approach is preferred.
// TODO: how can we achieve this?
Object.keys(event_types).forEach((name) => {
    events[name].typeId = event_types[name];
});

export = events;
