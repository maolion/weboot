import * as Path from 'path';

import {
  Command,
  command,
  param,
} from 'clime';

import { readFile } from '../utils';

import { CWD } from '../constants';

// tslint:disable-next-line:max-line-length
const resourceSectionRegEx = /<link[^>]*(?:rel="stylesheet")+[^>]*>|<style[^>]*>[^]*?<\/style>|<script[^>]*src="[^"]+"[^>]*>\s*<\/script>|<script[^>]*>[^]*?<\/script>/gi;
const inlineStyleSectionRegEx = /<style[^>]*>[^]+?<\/style>/i;
const externalStyleSectionRegEx = /<link/i;
const inlineScriptSectionRegEx = /<script[^>]*>[^]+?<\/script>/i;
const externalScriptSectionRegEx = /<script[^>]*src/i;
const styleTagRegEx = /<style[^>]*>([^]+?)<\/style>/i;
const styleLinkTagRegEx = /<link[^>]*href="([^"]+)"[^>]*>/i;
const scriptTagRegEx = /<script[^>]*>([^]+?)<\/script>/i;
const scriptLinkTagRegEx = /<script[^>]*src="([^"]+)"[^>]*>[\s]*<\/script>/i;

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
      description: 'Boot script file path',
    })
    bootScript: string,
    @param({
      required: false,
      type: String,
      description: 'Output file path',
    })
    output: string,
  ): Promise<void> {
    const originalEntryHtml = readFile(Path.join(CWD, entryHtml));

    const entryResources = parseEntryResources(originalEntryHtml);

    console.log(entryResources);
  }
}

// helpers

function parseEntryResources(entryHTML: string): Resource[] {
  let resources: Resource[] = [];
  let match: string[] | undefined | null;

  // tslint:disable-next-line:no-conditional-assignment
  while (match = resourceSectionRegEx.exec(entryHTML)) {
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
      default:
        throw new Error(`Unexpect resource "${resourceSection}"`);
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
    type: 'inline-style',
  };
}

function extractExternalStyleResource(resourceSection: string): StyleResource {
  let match = resourceSection.match(styleLinkTagRegEx);

  return {
    content: match ? match[1] : '',
    type: 'external-style',
  };
}

function extractInlineScriptResource(resourceSection: string): ScriptResource {
  let match = resourceSection.match(scriptTagRegEx);

  return {
    content: match ? match[1] : '',
    type: 'inline-script',
  };
}

function extractExternalScriptResource(resourceSection: string): ScriptResource {
  let match = resourceSection.match(scriptLinkTagRegEx);

  return {
    content: match ? match[1] : '',
    type: 'external-script',
  };
}
