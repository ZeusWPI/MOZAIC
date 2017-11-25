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
  dialog.showSaveDialog({filters:[{name:"JSON (default)", extensions: ['json']}, {name:"Custom File Type", extensions: ['']}]}, (fileName:string) => {
      if (fileName === undefined){
          return;
      }

      fs.writeFile(fileName, content, (err:any) => {
          if(err){
              alert("An error ocurred creating the file "+ err.message)
          }
      });
    });
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

export class ConfigForm extends React.Component
{
  render()
  {
    return h(Form, {schema: schema, uiSchema: uiSchema, onSubmit: onSubmit, validate: validate, showErrorList: false, noHtml5Validate: true});
  }
}
