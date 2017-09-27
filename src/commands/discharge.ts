import {
  Command,
  command,
  metadata,
} from 'clime';

@command({
  brief: 'Discharge the web application bootstrap program',
})
export default class DischargeCommand extends Command {
  @metadata
  async execute(): Promise<void> {
    console.log('hello, world');
  }
}
