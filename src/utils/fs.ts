import * as FS from 'fs';

export function readFile(path: string): string {
  return FS.readFileSync(path, 'utf8');
}
