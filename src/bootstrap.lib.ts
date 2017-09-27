// tslint:disable:unified-signatures
/// <reference path="./types.d.ts" />

namespace AppBootstrap {
  export interface Resource {
    url: string;
    type: ResourceType;
    block?: boolean;
  }

  export type OnComplete = (error: any | undefined) => void;
  export type OnReady = (run: () => void) => void;
  export type OnProgress = (percent: number, resource?: GeneralResourceType) => void;
  export type OnError = (reason: Error) => void;
  export type OnDone = () => void;

  export type GeneralResourceType = Resource | string | ((onComplete: OnComplete) => void);

  export type ProcessHandler = (
    onReady: (handler: OnReady) => void,
    onProgress: (handler: OnProgress) => void,
    onError: (handler: OnError) => void,
    onDone: (handler: OnDone) => void,
  ) => void;

  const TIMEOUT = 12000;
  const headElement = document.getElementsByTagName('head')[0];

  export function start(items: GeneralResourceType[], process: ProcessHandler): void {
    let listeners: {
      ready?: OnReady,
      progress?: OnProgress,
      error?: OnError,
      done?: OnDone,
    } = {};

    process(
      // ready
      handler => { listeners.ready = handler; },
      // progress
      handler => { listeners.progress = handler; },
      // error
      handler => { listeners.error = handler; },
      // done
      handler => { listeners.done = handler; },
    );

    onReady(() => {
      load(items, onProgress, error => {
        if (error) {
          onError(error);
        } else {
          onDone();
        }
      });
    });

    function onReady(run: () => void): void {
      if (listeners.ready) {
        listeners.ready(run);
      } else {
        run();
      }
    }

    function onProgress(percent: number, nextResource: GeneralResourceType | undefined): void {
      if (listeners.progress) {
        listeners.progress(percent, nextResource);
      }
    }

    function onError(reason: any): void {
      if (listeners.error) {
        listeners.error(reason);
      }
    }

    function onDone(): void {
      if (listeners.done) {
        listeners.done();
      }
    }
  }

  function createLoader(tagType: 'SCRIPT', onComplete: OnComplete): HTMLScriptElement;
  function createLoader(tagType: 'LINK', onComplete: OnComplete): HTMLLinkElement;
  function createLoader(tagType: ResourceTagType, onComplete: OnComplete) {
    let loader = document.createElement(tagType);
    let timeoutTimerHandle: number;

    if ('onload' in loader) {
      loader.onload = onLoad;
    } else {
      (loader as any).onreadystatechange = function () {
        if (this.readyState === 'loaded' || this.readyState === 'complete') {
          onLoad();
        }
      };
    }

    loader.onerror = onError;

    timeoutTimerHandle = setTimeout(onError, TIMEOUT) as any as number;

    return loader;

    function onLoad(): void {
      (loader as any).onload =  (loader as any).onerror = undefined;

      clearTimeout(timeoutTimerHandle);

      onComplete(undefined);
    }

    function onError(): void {
      (loader as any).onload =  (loader as any).onerror = undefined;

      onComplete(true);
    }
  }

  function mountLoader(loader: HTMLScriptElement | HTMLLinkElement): void {
    headElement.appendChild(loader);
  }

  function loadScript(url: string, onComplete: OnComplete): void {
    let loader = createLoader('SCRIPT', onComplete);

    loader.setAttribute('type', 'text/javascript');
    loader.setAttribute('src', url);

    mountLoader(loader);
  }

  function loadStyle(url: string, onComplete: OnComplete): void {
    let loader = createLoader('LINK', onComplete);

    loader.setAttribute('rel', 'stylesheet');
    loader.setAttribute('href', url);

    mountLoader(loader);
  }

  function load(resources: GeneralResourceType[], onProgress: OnProgress, onComplete: OnComplete): void {
    resources = typeof resources === 'string' ? [resources] : resources;

    let count = resources.length;
    let loadingCount = 0;
    let pendingResources = resources.slice();

    next();

    function next(): void {
      let resource = pendingResources.shift();

      let loadedCount = count - pendingResources.length - (loadingCount + 1);

      onProgress(loadedCount > 0 ? loadedCount / count : 0, resource);

      if (!resource) {
        return;
      }

      loadingCount++;

      if (resource instanceof Function) {
        resource(onResourceLoadComplete.bind(undefined, resource));
      } else if (isScriptsResource(resource)) {
        loadScript(
          isResourceObject(resource) ? resource.url : resource,
          onResourceLoadComplete.bind(undefined, resource),
        );
      } else if (isStyleResource(resource)) {
        loadStyle(
          isResourceObject(resource) ? resource.url : resource,
          onResourceLoadComplete.bind(undefined, resource),
        );

        if (isResourceObject(resource) && resource.block !== true) {
          next();
        }
      } else {
        onComplete(new Error('Unknown resource type'));
      }
    }

    function onResourceLoadComplete(resource: GeneralResourceType, error: Error | undefined): void {
      let blockedNextResource = !(isResourceObject(resource) && isStyleResource(resource) && resource.block !== true);

      if (error) {
        if (blockedNextResource) {
          onComplete(new Error(`Failed to load ${resource}`));
        }

        return;
      }

      loadingCount = Math.max(loadingCount - 1, 0);

      let loadedCount = count - pendingResources.length - loadingCount;

      if (loadingCount === 0 && loadedCount === count) {
        onProgress(1);
        onComplete(undefined);
        return;
      }

      if (!blockedNextResource) {
        return;
      }

      next();
    }
  }

  function isStyleResource(resource: GeneralResourceType): boolean {
    if (resource instanceof Function) {
      return false;
    }

    return isResourceObject(resource) ? resource.type === 'style' : /\.css$/i.test(resource);
  }

  function isScriptsResource(resource: GeneralResourceType): boolean {
    if (resource instanceof Function) {
      return false;
    }

    return isResourceObject(resource) ? resource.type === 'script' : /\.js$/i.test(resource);
  }

  function isResourceObject(resource: any): resource is Resource {
    return resource && !(resource instanceof Function) && typeof resource === 'object';
  }
}
