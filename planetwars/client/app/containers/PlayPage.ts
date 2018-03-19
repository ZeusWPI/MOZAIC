import * as React from 'react';
import { RouteComponentProps } from 'react-router';
import { h } from 'react-hyperscript-helpers';
import Play from '../components/play/Play';

import { connect } from 'react-redux';

export default connect(() => ({}), undefined)(Play);
