import {
  join,
  extname,
  dirname,
  format,
} from "https://deno.land/std/path/mod.ts";

const CWD = Deno.cwd();
const DENO_EXTNAMES = [".js", ".jsx", ".ts", ".tsx"];
const CONTEXT_PATH_KEY = "ESMODULE_SERVER_CONTEXT_PATH";
const DEFAULT_APP_INDEX = "index";
const DEFAULT_APP_INDEX_HTML = "index.html";
const DEFAULT_APP_OUTPUT_DIR = "dist/";

const HEADER_KEY_REFERER = "Referer";

export const MODE_DEV = "dev";
export const MODE_PRODUCTION = "production";
export const MODE_BUNDLE = "bundle";

const PROTOCOL_FILE = "file://";

export async function stat(path) {
  let stats;
  try {
    stats = await Deno.stat(path);
  } catch {
    stats = {};
  }
  return stats;
}

export function protocolFilePath(path) {
  return join(PROTOCOL_FILE, path);
}

export function isDenoScript(pathname) {
  const pathExtName = extname(pathname);
  return DENO_EXTNAMES.indexOf(pathExtName) >= 0;
}

export function isIgnoreScript(pathname) {
  return pathname.indexOf(DEFAULT_APP_OUTPUT_DIR) !== -1;
}

export async function getIndexApp(pathname) {
  const indexAppPath = join(CWD, pathname);
  const stats = await stat(indexAppPath);
  let indexApp;
  if (stats.isDirectory) {
    if (!pathname.endsWith("/")) {
      indexApp = { redirectTrailingSlash: true };
    } else {
      const indexHtmlStats = await stat(
        join(indexAppPath, DEFAULT_APP_INDEX_HTML)
      );
      if (!indexHtmlStats.isFile) {
        indexApp = await getIndexScript(indexAppPath);
        if (indexApp) indexApp.contextPath = pathname;
      }
    }
  } else if (!stats.isFile && indexAppPath.endsWith(DEFAULT_APP_INDEX_HTML)) {
    indexApp = await getIndexScript(dirname(indexAppPath));
    if (indexApp) indexApp.contextPath = dirname(pathname);
  }
  return indexApp;
}

async function getIndexScript(indexAppPath) {
  const indexAppScriptNamePath = join(indexAppPath, DEFAULT_APP_INDEX);
  let indexAppScriptAbsolutePath;
  let indexAppScriptPath;
  let indexAppScriptMtime;
  for (const ext of DENO_EXTNAMES) {
    const scriptPath = format({ name: indexAppScriptNamePath, ext });
    const stats = await stat(scriptPath);
    if (stats.isFile) {
      indexAppScriptAbsolutePath = scriptPath;
      indexAppScriptPath = format({ dir: ".", name: DEFAULT_APP_INDEX, ext });
      indexAppScriptMtime = stats.mtime;
      break;
    }
  }
  return indexAppScriptPath
    ? {
        absolutePath: indexAppScriptAbsolutePath,
        path: indexAppScriptPath,
        mtime: indexAppScriptMtime,
      }
    : null;
}

export function getModeFromSearchParams(searchParams, modeKey) {
  return searchParams.has(modeKey) && searchParams.get(modeKey) !== "false"
    ? modeKey
    : undefined;
}

export function getMode(request, findReferer = true) {
  const urlSearchParams = request.url.searchParams;
  let mode =
    getModeFromSearchParams(urlSearchParams, MODE_DEV) ||
    getModeFromSearchParams(urlSearchParams, MODE_PRODUCTION) ||
    (getModeFromSearchParams(urlSearchParams, MODE_BUNDLE) && MODE_PRODUCTION);
  if (!mode && findReferer && request.headers.has(HEADER_KEY_REFERER)) {
    const referer = request.headers.get(HEADER_KEY_REFERER);
    const refererSearchParams = new URL(referer).searchParams;
    mode =
      getModeFromSearchParams(refererSearchParams, MODE_DEV) ||
      getModeFromSearchParams(refererSearchParams, MODE_PRODUCTION) ||
      (getModeFromSearchParams(refererSearchParams, MODE_BUNDLE) &&
        MODE_PRODUCTION);
  }
  return mode;
}

export function getModeParam(mode) {
  return mode === MODE_DEV
    ? "?" + MODE_DEV
    : mode === MODE_PRODUCTION
    ? "?bundle"
    : "";
}

export async function getContextPath(cookies) {
  return (await cookies.get(CONTEXT_PATH_KEY)) || "/";
}

export async function setContextPath(cookies, contextPath) {
  await cookies.set(CONTEXT_PATH_KEY, contextPath, { path: contextPath });
}
