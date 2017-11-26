let styles = require('./ConfigForm.scss');

export const configSchema = {
  type: 'object',
  properties: {
    configName: { type: 'string', title: 'Configuration Name*', default: '' },
    config: {
      type: 'object',
      properties: {
        players: {
          type: 'array',
          title: 'Players',
          minItems: 1,
          items: {
            type: 'object',
            properties: {
              name: { type: 'string', title: 'Name*', default: '' },
              cmd: { type: 'string', title: 'Command*', default: '' },
              args: {
                type: 'array',
                title: 'Arguments',
                items: { type: 'string', title: 'Argument' },
                default: ['']
              }
            }
          },
          default: [{ name: '', cmd: '', args: [''] }]
        },
        game_config: {
          type: 'object',
          title: 'Game Config',
          properties: {
            map_file: { type: 'string', title: 'Map File*'/*, format: 'data-url'*/ },
            max_turns: { type: 'integer', title: 'Max Turns*', default: 500, 'minimum': 0 },
          }
        },
        log_file: { type: 'string', title: 'Log File*', default: 'gamelog.json' }
      }
    }
  }
};

export const configUISchema = {
  classNames: `${styles.configInput}`,
  configName: {},
  config: {
    players: {
      classNames: `${styles.players}`,
      items: {
        classNames: `${styles.player}`
      }
    },
    game_config: {
      
    },
    log_file: {
      
    }
  }
}
