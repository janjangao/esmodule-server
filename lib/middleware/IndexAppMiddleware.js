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
} from "./Util.js";
import HTML from "./HTML.jsx";
import { getEntryContent, getHtml } from "./Template.js";
import { generateAsync } from "../RollupGenerate.js";

const DEFAULT_APP_PRODUCTION_ENTRY = "./dist/index.js";

function renderStream(moduleEntry, mode, main, title, preloadedState = {}) {
  const entryContent = getEntryContent(moduleEntry, mode, true, preloadedState);
  return renderToReadableStream(
    React.createElement(HTML, {
      title,
      entryContent,
      children: [main({ preloadedState })],
    })
  );
}

function waitPreloadedState(
  getPreloadedState,
  getServerReady,
  retry = 2,
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

async function twiceRenderStream(
  moduleEntry,
  mode,
  main,
  title,
  getPreloadedState,
  getServerReady
) {
  renderToStaticMarkup(
    React.createElement(HTML, {
      children: [main({ preloadedState: {} })],
    })
  );
  const preloadedState =
    (await waitPreloadedState(getPreloadedState, getServerReady)) || {};
  return renderStream(moduleEntry, mode, main, title, preloadedState);
}

export async function getServerStream(absolutePath, moduleEntry, mode) {
  const module = await import(absolutePath);
  const main = module.default;
  if (main) {
    const title = module.title || "";
    if (!module.getPreloadedState) {
      return await renderStream(moduleEntry, mode, main, title);
    } else {
      return await twiceRenderStream(
        moduleEntry,
        mode,
        main,
        title,
        module.getPreloadedState,
        module.getServerReady
      );
    }
  }
  return;
}

export default async (context, next) => {
  const indexApp = await getIndexApp(context.request.url.pathname);
  if (indexApp) {
    const mode = getMode(context.request, false);
    const { absolutePath, path, contextPath, mtime } = indexApp;
    let moduleEntry = path;
    if (mode === MODE_PRODUCTION) {
      try {
        await generateAsync(absolutePath);
        moduleEntry = DEFAULT_APP_PRODUCTION_ENTRY;
      } catch (e) {
        console.error(`bundle indexApp: (${path}) failed!`);
        console.error(e);
      }
    }
    let body = "";
    try {
      body =
        (await getServerStream(absolutePath, moduleEntry, mode)) ||
        getHtml(moduleEntry, mode);
    } catch {
      body = getHtml(moduleEntry, mode);
    }
    context.response.body = body;
    await setContextPath(context.cookies, contextPath);
  } else {
    await next();
  }
};
