import * as React from 'react';

// tslint:disable-next-line:no-var-requires
const styles = require('./PlayPage.scss');

export default class Section extends React.Component<{ header: string }> {
  public render() {
    return (
      <div className={styles.sectionWithHeader}>
        <div className={styles.sectionHeader}>
          <h1>{this.props.header}</h1>
        </div>
        <div className={styles.verticalGrowAndScroll}>
          {this.props.children}
        </div>
      </div>
    );
  }
}
