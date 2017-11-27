import * as path from 'path';
import * as fs from 'fs';

import * as React from 'react';
import { h, div, button, p, select } from 'react-hyperscript-helpers';
import Form from 'react-jsonschema-form';
import { FormProps } from 'react-jsonschema-form';

let styles = require('./ConfigSelector.scss');

interface Props {
  files: path.ParsedPath[],
  selectFile(path: path.ParsedPath): any,
  previewFile(path: path.ParsedPath): any,
}

interface State {
  selectedConfig?: number,
  schema: any,
  files: path.ParsedPath[],
}

export class ConfigSelector extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      selectedConfig: undefined,
      schema: this.createSchema(props.files),
      files: props.files,
    }
  }

  createSchema(files: path.ParsedPath[]): any {
    let labels = files.map((path) => path.name);
    let schema = emptySchema;
    schema.properties.config.enum = Array.from(Array(files.length).keys());
    schema.properties.config.enumNames = labels;
    return schema;
  }

  componentWillReceiveProps(props: any) {
    this.setState({
      schema: this.createSchema(props.files),
      files: props.files,
    })
  }

  render() {
    return h(Form, `.${styles.configSelector}`,
      {
        schema: this.state.schema,
        uiSchema: uiSchema,
        formData: { config: this.state.selectedConfig },
        showErrorList: false,
        noHtml5Validate: true,
        onSubmit: (form: any) => this.props.selectFile(this.getSelected(form)),
        onChange: (form: any) => {
          form.errorSchema = {};
          if(form.formData.config >= 0) {
            this.props.previewFile(this.getSelected(form));
          }
        },
      },
      [
        p([button('.btn.btn-info', { type: 'submit' }, ['Play!'])])
      ]
    );
  }

  getSelected(form: any): path.ParsedPath {
    let index = form.formData.config;
    let selected = this.state.files[index];
    this.setState({selectedConfig: index})
    return selected;
  }

  static readConfigs(): path.ParsedPath[] {
    let dir = "./configs"
    if (fs.existsSync(dir)) {
      let fileNames = fs.readdirSync(dir);
      let paths = fileNames.map((f) => path.parse(path.resolve(dir, f)));
      return paths;
    }
    return [];
  }
}

const emptySchema = {
  type: 'object',
  properties: {
    config: {
      type: 'number',
      enum: [] as number[],
      enumNames: [] as string[],
    }
  },
  required: ['config']
};


const uiSchema = {
  classNames: `${styles.configSelectorItems}`,
  config: {
    'ui:options': {
      label: false
    },
    'ui:placeholder': 'Choose a config',
  }
}