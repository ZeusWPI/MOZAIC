import * as React from 'react';
import * as M from '../../database/models';

// tslint:disable-next-line:no-var-requires
const styles = require("./AddressForm.scss");

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
        <div className={styles.inputField}>
          <span>Host</span>
          <input
            type="text"
            value={host}
            onChange={this.setHost}
          />
        </div>
        <div className={styles.inputField}>
          <span>Port</span>
          <input
            type="number"
            value={port}
            onChange={this.setPort}
          />
        </div>
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
