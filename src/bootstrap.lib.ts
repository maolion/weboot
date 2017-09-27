// tslint:disable:unified-signatures

namespace AppBootstrap {
  export type ResourceTagType = 'script' | 'link';
  export type ResourceType = 'script' | 'style';
  export interface Resource {
    url: string;
    type: ResourceType;
  }
  export type GeneralResourceType = Resource | string;

  export type OnComplete = (error: any | undefined) => void;
  export type OnReady = (run: () => void) => void;
  export type OnProgress = (percent, resource: Resource) => void;
  export type OnError = (reason: Error) => void;
  export type OnDone = () => void;

  export type ProcessHandler = (
    onReady: OnReady,
    onProgress: OnProgress,
    onError: OnError,
    onDone: OnDone,
  ) => void;

  const TIMEOUT = 12000;
  const headElement = document.getElementsByTagName('head')[0];

  let stylesheet: StyleSheet | undefined;

  function start(items: GeneralResourceType[], process: ProcessHandler): void {
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
      handler => { listeners.done = handler; }
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

    function onReady(run: () => void) {
      if (listeners.ready) {
        listeners.ready(run);
      } else {
        run();
      }
    }

    function onProgress(percent, nextResourceUrl) {
      if (listeners.process) {
        listeners.process(percent, nextResourceUrl);
      }
    }

    function onError(reason) {
      if (listeners.error) {
        listeners.error(reason);
      }
    }

    function onDone() {
      if (listeners.done) {
        listeners.done();
      }
    }
  }

  function createLoader(tagType: 'script', onComplete: OnComplete): HTMLScriptElement;
  function createLoader(tagType: 'link', onComplete: OnComplete): HTMLLinkElement;
  function createLoader(tagType: ResourceTagType, onComplete: OnComplete) {
    let loader = document.createElement(tagType.toUpperCase());
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

    function onLoad() {
      loader.onload = loader.onerror = undefined;

      clearTimeout(timeoutTimerHandle);

      onComplete(undefined);
    }

    function onError() {
      loader.onload = loader.onerror = undefined;

      onComplete(true);
    }
  }

  function mountLoader(loader): void {
    headElement.appendChild(loader);
  }

  function loadScript(url, onComplete): void {
    let loader = createLoader('script', onComplete);

    loader.setAttribute('type', 'text/javascript');
    loader.setAttribute('src', url);

    mountLoader(loader);
  }

  function loadStyle(url, onComplete): void {
    let loader = createLoader('link', onComplete);

    loader.setAttribute('rel', 'stylesheet');
    loader.setAttribute('href', url);

    mountLoader(loader);
  }

  function isStyleResource(item) {
    return typeof item === 'object' ? item.type === 'style' : /\.css$/i.test(item);
  }

  function isScriptsResource(item) {
    return typeof item === 'object' ? item.type === 'scripts' : /\.js$/i.test(item);
  }

  function load(items, onProgress, onComplete): void {
    items = typeof items === 'string' ? [items] : items;

    let count = items.length;
    let loadingCount = 0;
    let pendingItems = items.slice();

    next();

    function next(): void {
      let item = pendingItems.shift();

      let loadedCount = count - pendingItems.length - (loadingCount + 1);

      onProgress(loadedCount > 0 ? loadedCount / count : 0, item);

      if (!item) {
        return;
      }

      loadingCount++;

      if (item instanceof Function) {
        item(onResourceLoadComplete.bind(undefined, item));
      } else if (isScriptsResource(item)) {
        loadScript(item === 'object' ? item.url : item, onResourceLoadComplete.bind(undefined, item));
      } else if (isStyleResource(item)) {
        loadStyle(item === 'object' ? item.url : item, onResourceLoadComplete.bind(undefined, item));

        if (item.block !== true) {
          next();
        }
      } else {
        onComplete(new Error('Unknown resource type'));
      }
    }

    function onResourceLoadComplete(currentLoadItem, error) {
      let blockedNextResource = !(isStyleResource(currentLoadItem) && currentLoadItem.block !== true);

      if (error) {
        if (blockedNextResource) {
          onComplete(new Error(`Failed to load ${currentLoadItem}`));
        }

        return;
      }

      loadingCount = Math.max(loadingCount - 1, 0);

      let loadedCount = count - pendingItems.length - loadingCount;

      if (loadingCount === 0 && loadedCount === count) {
        onProgress(1);
        onComplete();
        return;
      }

      if (!blockedNextResource) {
        return;
      }

      next();
    }
  }
}

// var AppBootstrap = (function() {
//   var TIMEOUT = 12000;
//   var head = document.getElementsByTagName('head')[0];

//   return {
//     start: start,
//   };



// })();
