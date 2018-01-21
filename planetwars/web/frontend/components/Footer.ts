import * as React from 'react';
import * as FA from 'react-fontawesome';
import { h, p, a } from 'react-hyperscript-helpers';
import { Footer as BFooter, Container } from 'bloomer';

export default class Footer extends React.Component<{}, {}> {
  render() {
    return h(BFooter, {}, [
      h(Container, { hasTextAlign: 'centered', }, [
        p([
          'Made with ',
          h(FA, {name: 'heart', className: 'heart'}),
          ' by Zeus WPI']
        ),
        p([
          a({href: 'https://zeus.ugent.be'}, [
            'View on GitHub ',
             h(FA, { name:'github' })
          ])
        ])
      ])
    ]);
  }
}
