import {
  renderToReadableStream,
  renderToStaticMarkup,
} from "https://esm.sh/react-dom/server";
import React from "https://esm.sh/react";
import {
  MODE_PRODUCTION,
  getIndexApp,
  getMode,
  setContextPath,
  protocolFilePath,
} from "./Util.js";
import HTML from "./HTML.jsx";
import { getEntryContent, getHtml } from "./Template.js";
import { generateAsync } from "../RollupGenerate.js";

const DEFAULT_APP_PRODUCTION_ENTRY = "./dist/index.js";

function renderStream(
  moduleEntry,
  mode,
  module,
  preloadedContext = {},
  preloadedState = {}
) {
  const { default: main, stylesheets, scripts, title = "" } = module;
  const entryContent = getEntryContent(moduleEntry, mode, true, preloadedState);
  return renderToReadableStream(
    React.createElement(HTML, {
      title,
      stylesheets,
      scripts,
      entryContent,
      children: [main({ preloadedContext, preloadedState })],
    })
  );
}

function waitPreloadedState(
  getPreloadedState,
  getServerReady,
  retry = 3,
  delay = 0
) {
  return new Promise((resolve) => {
    getPreloadedState =
      typeof getPreloadedState === "function"
        ? getPreloadedState
        : () => getPreloadedState;
    getServerReady =
      typeof getServerReady === "function"
        ? getServerReady
        : () => getServerReady;
    let n = 0;
    const callImmediate = () => {
      if (n >= retry) {
        resolve(getPreloadedState());
        return;
      }
      setTimeout(() => {
        n++;
        if (getServerReady()) {
          resolve(getPreloadedState());
        } else {
          callImmediate();
        }
      }, delay);
    };
    callImmediate();
  });
}

async function twiceRenderStream(moduleEntry, mode, module, preloadedContext) {
  const { default: main, getPreloadedState, getServerReady } = module;
  renderToStaticMarkup(
    React.createElement(HTML, {
      children: [main({ preloadedContext, preloadedState: {} })],
    })
  );
  const preloadedState =
    (await waitPreloadedState(getPreloadedState, getServerReady)) || {};
  return renderStream(
    moduleEntry,
    mode,
    module,
    preloadedContext,
    preloadedState
  );
}

export async function getServerStream(absolutePath, moduleEntry, mode, reload) {
  if (reload) absolutePath += `#${+new Date()}`;
  const module = await import(protocolFilePath(absolutePath));
  if (module.default) {
    const preload = module.preload;
    const preloadedContext =
      preload && typeof preload === "function" ? (await preload()) || {} : {};
    if (!module.getPreloadedState) {
      return await renderStream(moduleEntry, mode, module, preloadedContext);
    } else {
      return await twiceRenderStream(
        moduleEntry,
        mode,
        module,
        preloadedContext
      );
    }
  }
  return;
}

function getTimestamp(mtime) {
  let timestamp = mtime.getTime();
  timestamp -= timestamp % 1000;
  return timestamp;
}

export default async (context, next) => {
  const request = context.request;
  const response = context.response;
  const indexApp = await getIndexApp(request.url.pathname);
  if (indexApp) {
    if (indexApp.redirectTrailingSlash) {
      const url = context.request.url;
      response.status = 301;
      response.headers.set(
        "Location",
        new URL(url.pathname + "/" + url.search, url)
      );
      return;
    }

    const mode =
      (context.settings && context.settings.mode) || getMode(request, false);
    const { absolutePath, path, contextPath, mtime } = indexApp;
    const timestamp = getTimestamp(mtime);
    const ifModifiedSince = request.headers.get("If-Modified-Since");
    const isAppchanged =
      !ifModifiedSince || new Date(ifModifiedSince).getTime() < timestamp;
    let moduleEntry = path;
    if (mode === MODE_PRODUCTION) {
      if (isAppchanged) {
        try {
          await generateAsync(absolutePath);
          moduleEntry = DEFAULT_APP_PRODUCTION_ENTRY;
        } catch (e) {
          console.error(`bundle indexApp: (${path}) failed!`);
          console.error(e);
        }
      }
      response.headers.set("Last-Modified", new Date(timestamp).toUTCString());
    }
    let body = "";
    try {
      body =
        (await getServerStream(
          absolutePath,
          moduleEntry,
          mode,
          isAppchanged
        )) || getHtml(moduleEntry, mode);
    } catch {
      body = getHtml(moduleEntry, mode);
    }
    context.response.body = body;
    await setContextPath(context.cookies, contextPath);
  } else {
    await next();
  }
};
