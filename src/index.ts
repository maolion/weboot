import 'source-map-support/register';

import { CLI } from 'clime';

import {
  COMMANDS_DIR,
} from './constants';

let cli = new CLI('weboot', COMMANDS_DIR);

export default cli;
