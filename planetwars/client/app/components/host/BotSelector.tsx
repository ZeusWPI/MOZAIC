import * as React from 'react';
import * as M from '../../utils/database/models';

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
    <select value={props.value} onChange={onChange}>
        <option value="">Select Bot</option>
        {options}
    </select>
  );
};

export default BotSelector;
