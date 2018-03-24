import * as React from 'react';

export const FatalError: React.SFC<{ error: any }> = ({ error }) => {
  return (
    <section className="hero is-fullheight is-dark">
      <div className="hero-body">
        <div className="container">
          <h1 className="title">
            Oh no!
          </h1>
          <h2 className="subtitle">
            A fatal error occurred
          </h2>
          <p>
            {error.toString()}
          </p>
        </div>
      </div>
    </section>
  );
};
