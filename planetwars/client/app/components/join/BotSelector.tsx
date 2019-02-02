import * as React from 'react';
import * as M from '../../database/models';
import { HorizontalInput } from '../play/Config';

export interface BotSelectorProps {
  value?: M.BotId;
  bots: M.BotList;
  onChange?: (botId: M.BotId) => void;
}

export const BotSelector: React.SFC<BotSelectorProps> = (props) => {
  const options = Object.keys(props.bots).map((uuid) => {
    return (
      <option value={uuid} key={uuid}>
        {props.bots[uuid].name}
      </option>
    );
  });

  const onChange = (e: any) => {
    if (props.onChange) {
      props.onChange(e.target.value);
    }
  };

  return (
    <HorizontalOption id="bot" label="Bot">
      <select value={props.value} onChange={onChange}>
        <option value="">Select Bot</option>
        {options}
      </select>
    </HorizontalOption>
  );
};

export default BotSelector;

export interface OptionProps { id: string; label: string; }
export const HorizontalOption: React.SFC<OptionProps> = (props) => {
  return (
    <div className="field is-horizontal">
      <div className="field-label">
        <label htmlFor={props.id} className="label">{props.label}</label>
      </div>
      <div className="field-body">
        <div className="field">
          <div className="control">
            <div className="select">
              {props.children}
            </div>
          </div>
        </div>
      </div>
    </div>);
};
