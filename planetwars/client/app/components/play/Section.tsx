import * as React from 'react';

import * as css from './PlayPage.scss';

export default class Section extends React.Component<{ header: string, onMouseMove?: () => void; }> {
  public render() {
    return (
      <div className={css.sectionWithHeader} onMouseMove={this.props.onMouseMove}>
        <div className={css.sectionHeader}>
          <h1>{this.props.header}</h1>
        </div>
        <div className={css.verticalGrowAndScroll}>
          {this.props.children}
        </div>
      </div>
    );
  }
}
