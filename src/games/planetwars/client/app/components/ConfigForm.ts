import * as React from 'react';
import { h } from 'react-hyperscript-helpers';
import Form from "react-jsonschema-form";
import FormProps from "react-jsonschema-form";

const {dialog} = require('electron').remote;
var fs = require('fs');

// let styles = require('./ConfigForm.scss');

const schema = {
  title: "Configuration",
  type: "object",
  properties: {
      config_name: { type: "string", title: "Configuration Name*", default: "" },
      players: {
        type:"array",
        title: "Players",
        minItems: 1,
        items: {
          type: "object",
          title: "Player",
          properties: {
            name: { type: "string", title: "Name*", default: "" },
            cmd: { type: "string", title: "Command*", default: "" },
            args: {
              type: "array",
              title: "Arguments",
              items: { type: "string", title: "Argument" },
              default: [""]
            }
          }
        },
        default: [{name: "", cmd: "", args: [""]}]
      },
      game_config: {
        type: "object",
        title: "Game Config",
        properties: {
          map_file: { type: "string", title: "Map File*"/*, format: "data-url"*/},
          max_turns: { type: "integer", title: "Max Turns*", default: 500, "minimum": 0},
        }
      },
      log_file: {type: "string", title:"Log File*", default: "gamelog.json"}
    }
};

const uiSchema = {
  game_config: {
    max_turns: {
      "ui:widget" : "updown"
    }
  },
  // classNames: `${ styles.arrayList }`
}

const onSubmit = (form:any) => submit(form.formData);
const onError = (err:any) => console.log(err);

function submit(formData:any) {
  var content = JSON.stringify(formData);
  var path = "./configs/" + formData.config_name.toString() + ".json";
  if(!(fs.existsSync(path)) || confirm("Configuration with name \"" + formData.config_name.toString() + "\" already exist, do you want to overwrite it?"))
  {
    fs.writeFileSync(path, content, (err:any) => {
      if(err){
        alert("An error ocurred creating the file "+ err.message);
        return;
      }
    });
    alert("Succesfully saved configuration " + formData.config_name.toString() + ".");
  }
}

function validate(form:any, errors:any) {
  const requiredField = "This is a required field";

  if(!testUnique(form.players.map((a:any) => a.name)))
  {
    errors.players.addError("Duplicate names found");
  }

  for(var i = 0; i < form.players.length; i++)
  {
    if(isEmpty(form.players[i].name))
    {
      errors.players[i].name.addError(requiredField);
    }

    if(isEmpty(form.players[i].cmd))
    {
      errors.players[i].cmd.addError(requiredField);
    }

    for(var j = 0; j < form.players[i].args.length; j++)
    {
      if(isEmpty(form.players[i].args[j]))
      {
        errors.players[i].args[j].addError("Please remove empty arguments");
      }
    }
  }

  if(isEmpty(form.log_file))
  {
    errors.log_file.addError(requiredField);
  }

  if(isEmpty(form.config_name))
  {
    errors.config_name.addError(requiredField);
  }

  if(isEmpty(form.game_config.map_file))
  {
    errors.game_config.map_file.addError(requiredField);
  }

  if(isEmpty(form.game_config.max_turns))
  {
    errors.game_config.max_turns.addError(requiredField);
  }
  return errors;
}

function isEmpty(value:any)
{
  return (value == "" || value == undefined)
}

function testUnique(list:Array<any>)
{
  var unique = true;

  for(var i = 0; i < list.length; i++)
  {
    if(!(list.indexOf(list[i]) === i))
    {
      unique = false;
    }
  }
  return unique;
}

interface ConfigFormState {
  configValues: object
}

export class ConfigForm extends React.Component<any, ConfigFormState>
{
  constructor(props:any)
  {
    super(props);
    this.state = {
      configValues: defaultValues()
    };
  }
  render()
  {
    let dir = "./configs"
    if(!fs.existsSync(dir))
    {
      fs.mkdirSync(dir);
    }
    var fileNames = fs.readdirSync(dir);
    fileNames = fileNames.map((fileName:string) => fileName.replace(/\.[^/.]+$/, ""))

    var fileSelectorSchema = {
      type: "array",
      minItems: 1,
      maxItems: 1,
      title: "File",
      items: {
        type: "string",
        enum: fileNames
      },
      uniqueItems: true
    };

    return h("div", [
      h(Form, {schema: fileSelectorSchema, onSubmit: this.onSubmitFile.bind(this), showErrorList: false, noHtml5Validate: true}),
      h(Form, {schema: schema, uiSchema: uiSchema, onSubmit: this.onSubmitConfig.bind(this), validate: validate, showErrorList: false, noHtml5Validate: true, formData: this.state.configValues})]);
  }

  onSubmitFile(form:any) {
    this.loadConfig(form.formData[0].toString());
  }

  onSubmitConfig(form:any)
  {
    onSubmit(form);
    this.loadConfig(form.formData.config_name);
  }

  loadConfig(name:any)
  {
    try {
      var obj = JSON.parse(fs.readFileSync("./configs/" + name + ".json", 'utf8'));
    } catch(e) {
      alert("Could not load configuration");
      console.error(e);
    }
    this.setState({configValues:obj});
  }
}

function defaultValues()
{
  return {"config_name":"","players":[{"name":"","cmd":"","args":[""]}],"game_config":{"map_file":"","max_turns":500},"log_file":"gamelog.json"}
}
