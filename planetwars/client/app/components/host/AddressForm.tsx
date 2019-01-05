import * as React from 'react';
import * as M from '../../database/models';
import { HorizontalInput } from '../play/Config';

// tslint:disable-next-line:no-var-requires
import * as styles from "./AddressForm.scss";

export interface AddressFormProps {
  address: M.Address;
  onChange: (address: M.Address) => void;
}

export class AddressForm extends React.Component<AddressFormProps> {
  constructor(props: AddressFormProps) {
    super(props);
    this.setHost = this.setHost.bind(this);
    this.setPort = this.setPort.bind(this);
  }

  public render() {
    const { host, port } = this.props.address;
    return (
      <div>
        <HorizontalInput label="Host" id="host">
          <input
            type="text"
            value={host}
            onChange={this.setHost}
          />
        </HorizontalInput>
        <HorizontalInput label="Port" id="port">
          <input
            type="number"
            value={port}
            onChange={this.setPort}
          />
        </HorizontalInput>
      </div>
    );
  }

  private setHost(evt: React.FormEvent<HTMLInputElement>) {
    this.props.onChange({
      ...this.props.address,
      host: evt.currentTarget.value,
    });
  }

  private setPort(evt: React.FormEvent<HTMLInputElement>) {
    this.props.onChange({
      ...this.props.address,
      port: evt.currentTarget.valueAsNumber,
    });
  }
}

export default AddressForm;
