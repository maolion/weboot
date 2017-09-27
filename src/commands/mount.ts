import {
  Command,
  command,
  param,
} from 'clime';

@command({
  brief: 'Mount the web application bootstrap program',
})
export default class MountCommand extends Command {
  async execute(
    @param({
      required: true,
      type: String,
      description: 'Entry html file path',
    })
    entryHtml: string,
    @param({
      required: false,
      type: String,
      description: 'boot script file path',
    })
    bootScript: string,
    @param({
      required: false,
      type: String,
      description: 'Output file path',
    })
    output: string,
  ): Promise<void> {
    console.log('hello, world');
  }
}
