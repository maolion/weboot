// tslint:disable:max-line-length

import * as Path from 'path';
import * as UglifyJS from 'uglify-js';

import { Command, Options, command, option, param } from 'clime';

import { readFile, safeReadFile, writeFile } from '../utils';

import { CWD } from '../constants';

const VERSION = require('../../package.json').version;

const resourceSectionRegEx = /<link[^>]*(?:rel="stylesheet")+[^>]*>|<style[^>]*>[^]*?<\/style>|<script[^>]*src="[^"]+"[^>]*>\s*<\/script>|<script[^>]*>[^]*?<\/script>/gi;
const inlineStyleSectionRegEx = /<style[^>]*>[^]+?<\/style>/i;
const externalStyleSectionRegEx = /<link/i;
const inlineScriptSectionRegEx = /<script[^>]*>[^]+?<\/script>/i;
const externalScriptSectionRegEx = /<script[^>]*src/i;
const styleTagRegEx = /<style[^>]*>([^]+?)<\/style>/i;
const styleLinkTagRegEx = /<link[^>]*href="([^"]+)"[^>]*>/i;
const scriptTagRegEx = /<script[^>]*>([^]+?)<\/script>/i;
const scriptLinkTagRegEx = /<script[^>]*src="([^"]+)"[^>]*>[\s]*<\/script>/i;

export class MountOptions extends Options {
  @option<boolean>({
    flag: 'p',
    description: 'Enable optimize minimize source code',
    default: false,
    toggle: true
  })
  prod: boolean;

  @option<string>({
    flag: 'b',
    description: 'Specify boot script file path'
  })
  bootScript: string;

  @option<boolean>({
    description: 'Disable warning log',
    default: false,
    toggle: true
  })
  noWarning: boolean;
}

@command({
  brief: 'Mount the web application bootstrap program'
})
export default class MountCommand extends Command {
  async execute(
    @param({
      required: true,
      type: String,
      description: 'Entry html file path'
    })
    entryHtml: string,
    @param({
      required: false,
      type: String,
      description: 'Output file path'
    })
    output: string,
    options: MountOptions
  ): Promise<void> {
    const entryFile = Path.join(CWD, entryHtml);
    const originalEntryHtml = readFile(entryFile);

    if (/<!--Weboot v[^ ]+ {BOOT/.test(originalEntryHtml)) {
      if (!options.noWarning) {
        // tslint:disable-next-line
        console.warn('Target was mounted weboot!!!');
      }
      return;
    }

    const bootstrapLibSourceCode = readFile(
      Path.join(CWD, 'dist', 'bootstrap.lib.js')
    );
    const bootScript = options.bootScript;
    const bootScriptSourceCode = bootScript
      ? readFile(Path.join(CWD, bootScript))
      : '';
    const bootStyleSourceCode = bootScript
      ? safeReadFile(
          Path.join(
            CWD,
            Path.dirname(bootScript),
            `${Path.basename(bootScript, Path.extname(bootScript))}.css`
          )
        )
      : '';
    const entryResources = parseEntryResources(originalEntryHtml);

    let outputEntryHtml = originalEntryHtml.replace(resourceSectionRegEx, '');

    if (bootStyleSourceCode) {
      outputEntryHtml = outputEntryHtml.replace(
        '</head>',
        `<!--Weboot v${VERSION} {BOOT STYLE--><style>${minimizeCSS(
          bootStyleSourceCode,
          options.prod
        )}</style><!--BOOT STYLE}--></head>`
      );
    }

    let bootstrapCode = `
    (function(){
      ${bootstrapLibSourceCode}

      ;'/* weboot start */';
      AppBootstrap.start(${JSON.stringify(
        entryResources
      )}, function(onReady, onProgress, onError, onDone, AppBootstrap) {
        ${bootScriptSourceCode}
      });
      ;'/* weboot end */'
    })();
    `;

    outputEntryHtml = outputEntryHtml.replace(
      '</body>',
      `<!--Weboot v${VERSION} {BOOT SCRIPT--><script>${minimizeJS(
        bootstrapCode,
        options.prod
      )}</script><!--BOOT SCRIPT}--></body>`
    );

    writeFile(output ? Path.join(CWD, output) : entryFile, outputEntryHtml);
  }
}

// helpers

function parseEntryResources(entryHTML: string): Resource[] {
  let resources: Resource[] = [];
  let match: string[] | undefined | null;

  // tslint:disable-next-line:no-conditional-assignment
  while ((match = resourceSectionRegEx.exec(entryHTML))) {
    let resourceSection = match[0];

    switch (true) {
      case isInlineStyleResourceSection(resourceSection):
        resources.push(extractInlineStyleResource(resourceSection));
        break;
      case isExternalStyleResourceSection(resourceSection):
        resources.push(extractExternalStyleResource(resourceSection));
        break;
      case isInlineScriptResourceSection(resourceSection):
        resources.push(extractInlineScriptResource(resourceSection));
        break;
      case isExternalScriptResourceSection(resourceSection):
        resources.push(extractExternalScriptResource(resourceSection));
        break;
    }
  }

  return resources;
}

function isInlineStyleResourceSection(resourceSection: string): boolean {
  return inlineStyleSectionRegEx.test(resourceSection);
}

function isExternalStyleResourceSection(resourceSection: string): boolean {
  return externalStyleSectionRegEx.test(resourceSection);
}

function isInlineScriptResourceSection(resourceSection: string): boolean {
  return inlineScriptSectionRegEx.test(resourceSection);
}

function isExternalScriptResourceSection(resourceSection: string): boolean {
  return externalScriptSectionRegEx.test(resourceSection);
}

function extractInlineStyleResource(resourceSection: string): StyleResource {
  let match = resourceSection.match(styleTagRegEx);

  return {
    content: match ? match[1] : '',
    type: 'inline-style'
  };
}

function extractExternalStyleResource(resourceSection: string): StyleResource {
  let match = resourceSection.match(styleLinkTagRegEx);

  return {
    content: match ? match[1] : '',
    type: 'external-style'
  };
}

function extractInlineScriptResource(resourceSection: string): ScriptResource {
  let match = resourceSection.match(scriptTagRegEx);

  return {
    content: match ? match[1] : '',
    type: 'inline-script'
  };
}

function extractExternalScriptResource(
  resourceSection: string
): ScriptResource {
  let match = resourceSection.match(scriptLinkTagRegEx);

  return {
    content: match ? match[1] : '',
    type: 'external-script'
  };
}

// helpers

function minimizeJS(code: string, enable = true): string {
  if (!enable) {
    return code;
  }

  let result = UglifyJS.minify(code, {
    warnings: false
  });

  if ((result as any).error) {
    throw new Error((result as any).error);
  }

  return result.code;
}

function minimizeCSS(code: string, enable = true): string {
  if (!enable) {
    return code;
  }

  return code.replace(/(?:^\s+|[\r\n]+\s*|[\s\r\n]*$)/g, '');
}
