import * as FS from 'fs';

export function readFile(path: string): string {
  return FS.readFileSync(path, 'utf8');
}

export function safeReadFile(path: string): string {
  try {
    return FS.readFileSync(path, 'utf8');
  } catch (e) {
    return '';
  }
}

export function writeFile(path: string, content: string): void {
  FS.writeFileSync(path, content, 'utf8');
}
