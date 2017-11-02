// tslint:disable:unified-signatures
/// <reference path="./types.d.ts" />

namespace AppBootstrap {
  export type OnComplete = (error: any | undefined) => void;
  export type OnReady = (run: () => void) => void;
  export type OnProgress = (percent: number, resource?: Resource) => void;
  export type OnError = (reason: Error) => void;
  export type OnDone = () => void;

  export type ProcessHandler = (
    onReady: (handler: OnReady) => void,
    onProgress: (handler: OnProgress) => void,
    onError: (handler: OnError) => void,
    onDone: (handler: OnDone) => void,
  ) => void;

  const TIMEOUT = 12000;
  const headElement = document.getElementsByTagName('head')[0];

  export function start(resources: Resource[], process: ProcessHandler): void {
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
      load(resources, onProgress, error => {
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

    function onProgress(percent: number, nextResource: Resource | undefined): void {
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

  function load(resources: Resource[], onProgress: OnProgress, onComplete: OnComplete): void {
    let count = resources.length;
    let loadingCount = 0;
    let pendingResources = resources.slice();

    next();

    function next(): void {
      let resource = pendingResources.shift();

      let loadedCount = count - pendingResources.length - (loadingCount + 1);

      onProgress(loadedCount > 0 ? Math.round(loadedCount / count * 10000) / 100 : 0, resource);

      if (!resource) {
        return;
      }

      loadingCount++;

      if (resource instanceof Function) {
        resource(onResourceLoadComplete.bind(undefined, resource));
      } else if (isScriptResource(resource)) {
        loadScript(
          resource,
          onResourceLoadComplete.bind(undefined, resource),
        );

        if (resource.type === 'inline-script' || resource.block === false) {
          next();
        }
      } else if (isStyleResource(resource)) {
        loadStyle(
          resource,
          onResourceLoadComplete.bind(undefined, resource),
        );

        if (resource.type === 'inline-style' || resource.block !== true) {
          next();
        }
      } else {
        onComplete(new Error('Unknown resource type'));
      }
    }

    function onResourceLoadComplete(resource: Resource, error: Error | undefined): void {
      let blockedNextResource = true;

      if (resource.block === false || (isStyleResource(resource) && resource.block !== true)) {
        blockedNextResource = false;
      }

      if (error) {
        if (blockedNextResource) {
          onComplete(new Error(`Failed to load "${resource.content}" of <${resource.type}>`));
        }

        return;
      }

      loadingCount = Math.max(loadingCount - 1, 0);

      let loadedCount = count - pendingResources.length - loadingCount;

      if (loadingCount === 0 && loadedCount === count) {
        onProgress(100);
        onComplete(undefined);
        return;
      }

      if (!blockedNextResource) {
        return;
      }

      next();
    }
  }

  function loadStyle(resource: StyleResource, onComplete: OnComplete): void {
    let isExternalStyle = resource.type === 'external-style';
    let loader = isExternalStyle ?
      createLoader('LINK', onComplete) : createLoader('STYLE', onComplete);

    if (isExternalStyle) {
      loader.setAttribute('rel', 'stylesheet');
      loader.setAttribute('href', resource.content);
    } else {
      loader.setAttribute('type', 'text/css');

      if ((loader as any).styleSheet) {
        (loader as any).styleSheet.cssText = resource.content;
      } else {
        loader.appendChild(document.createTextNode(resource.content));
      }

      if (loader.onload instanceof Function) {
        loader.onload(undefined as any);
      }
    }

    mountLoader(loader);
  }

  function loadScript(resource: ScriptResource, onComplete: OnComplete): void {
    let loader = createLoader('SCRIPT', onComplete);

    loader.setAttribute('type', 'text/javascript');

    if (resource.type === 'external-script') {
      loader.setAttribute('src', resource.content);
    } else {
      loader.text = resource.content;
    }

    mountLoader(loader);
  }

  function createLoader(tagType: 'SCRIPT', onComplete: OnComplete): HTMLScriptElement;
  function createLoader(tagType: 'STYLE', onComplete: OnComplete): HTMLStyleElement;
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

  function mountLoader(loader: HTMLScriptElement | HTMLStyleElement | HTMLLinkElement): void {
    headElement.appendChild(loader);
  }

  function isStyleResource(resource: Resource): resource is StyleResource {
    return resource && resource.type === 'external-style' || resource.type === 'inline-style';
  }

  function isScriptResource(resource: Resource): resource is ScriptResource {
    return resource && resource.type === 'external-script' || resource.type === 'inline-script';
  }
}
