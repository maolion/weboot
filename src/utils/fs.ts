import * as FS from 'fs';

export function readFile(path: string): string {
  return FS.readFileSync(path, 'utf8');
}

export function writeFile(path: string, content: string): void {
  return FS.writeFileSync(path, content, 'utf8');
}
