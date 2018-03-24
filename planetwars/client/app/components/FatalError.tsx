import * as React from 'react';

export const FatalError: React.SFC<{ error: any }> = ({ error }) => {
  const Github = () => (
    <a href="https://github.com/ZeusWPI/MOZAIC/issues/">
      GitHub <span className="fa fa-github" />
    </a>
  );
  return (
    <section className="hero is-fullheight is-dark">
      <div className="hero-body">
        <div className="container">
          <h1 className="title is-size-1">
            Oh no!
          </h1>
          <h2 className="subtitle is-size-2">
            A fatal error occurred
          </h2>
          <p className="box has-text-dark">
            {error.toString()}
          </p>
          <p className="is-size-5">
            Please submit a bugreport on <Github />
          </p>
        </div>
      </div>
    </section>
  );
};
