import {
  Command,
  command,
  metadata,
} from 'clime';

@command({
  brief: 'Unmount the web application bootstrap program',
})
export default class UnmountCommand extends Command {
  @metadata
  async execute(): Promise<void> {
    console.log('hello, world');
  }
}
