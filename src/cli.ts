import 'source-map-support/register';

import { CLI } from 'clime';

import {
  COMMANDS_DIR,
} from './constants';

export const cli = new CLI('weboot', COMMANDS_DIR);
