import * as M from '../database/models';
import { v4 as uuidv4 } from 'uuid';
import { createAction } from 'typesafe-actions';

export const addBot = createAction('ADD_BOT', (resolve) => {
  return ({ name, command }) => {
    const now = new Date();
    const uuid = uuidv4();
    const bot: M.Bot = {
      uuid,
      name,
      command,
      createdAt: now,
      lastUpdatedAt: now,
    };
    return resolve(bot);
  };
});

export const editBot = createAction('EDIT_BOT', (resolve) => {
  return (bot: M.Bot) => resolve(bot);
});

export const removeBot = createAction('REMOVE_BOT', (resolve) => {
  return (botId: string) => resolve(botId);
});
