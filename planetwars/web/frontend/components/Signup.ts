import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { h, div, p, form, input, a, label } from 'react-hyperscript-helpers';
import NavBar from './Navbar';
import Footer from './Footer';
import { Hero } from 'bloomer';
import { Container } from 'bloomer/lib/layout/Container';
import { HeroBody } from 'bloomer/lib/layout/Hero/HeroBody';
import { error } from 'util';

export default class Signup extends React.Component<{}, {}> {
  render() {
    return [
      h(NavBar),
      h(Hero, '.push', {isColor: 'primary'}, [
          h(HeroBody, '#signup-page', [
            h(SignupBox)
          ])
      ]),
      h(Footer),
    ]
  }
}

interface ISignupBoxState {
  email: string,
  success: boolean,
  errors: {message: string}[]
}
class SignupBox extends React.Component<{}, ISignupBoxState> {
  constructor(props: {}){
    super(props);
    this.state = {email: '', success: false, errors: []};
    this.handleChange = this.handleChange.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
  }

  handleChange(event: any) {
    this.setState({email: event.target.value});
  }

  subscribe(): Promise<Response> {
    return fetch('/subscribe', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: this.state.email
      })
    })
  }

  handleSubmit(event: any) {
    event.preventDefault();
    this.subscribe().then((resp: Response) => {
      if(resp.ok) {
        this.setState({success: true});
        return Promise.resolve();
      } 

      if(resp.status === 400) {
        resp.text().then((text) => {
          this.setState({errors: JSON.parse(text)})
        });
        return Promise.resolve();
      }

      return Promise.reject(resp);
    }).catch((error) => {console.log(error); alert("Something went wrong, see console"); });
  }
  
  render() {
    if(this.state.success) {
      return div('#signup-box.container', [
        p('Well received! See you later...')
      ])
    }

    return div('#signup-box.container', [
      form({action: '/subscribe', method: 'POST', onSubmit: this.handleSubmit}, [
        label('.label', {htmlFor: 'email'}, ['Enter email and keep up to date!']),
        div('.field.has-addons', [
          div('.control', [
            input('.input', {
              id: 'email',
              type: 'text',
              value: this.state.email,
              onChange: this.handleChange,
              placeholder: 'eg. bottle@bats.com'
            })
          ]),
          div('.control', [
            input('.button.submit', {type: 'submit', value: 'Subscribe'})
          ]),
          p(this.state.errors.map(v => v.message))
        ])
      ])
    ])
  }
}
