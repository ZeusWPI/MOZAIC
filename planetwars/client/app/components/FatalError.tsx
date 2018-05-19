import * as React from 'react';
import { shell } from 'electron';

interface Props {
  error: Error;
  message?: string;
}

function launchIssues() {
  shell.openExternal('https://github.com/ZeusWPI/MOZAIC/issues/');
}

const Github = () => (
  <a
    href="https://github.com/ZeusWPI/MOZAIC/issues/"
    onClick={launchIssues}
  >
    GitHub <span className="fa fa-github" />
  </a>
);

export const FatalErrorView: React.SFC<Props> = ({ error, message }) => {
  return (
    <section className="hero is-fullheight is-dark">
      <div className="hero-body">
        <div className="container">
          <h1 className="title is-size-1">
            Oh no!
          </h1>
          <h2 className="subtitle is-size-2">
            {message || 'A fatal error occurred'}
          </h2>
          <p className="box has-text-dark">
            {error.toString()}
          </p>
          <pre className='box has-text-dark'>
            {error.stack || 'No stack trace :\'('}
          </pre>
          <p className="is-size-5">
            Please submit a bugreport on <Github />
          </p>
        </div>
      </div>
    </section>
  );
};
