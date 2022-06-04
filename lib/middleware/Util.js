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

const MODE_DEV = "dev";
const MODE_PRODUCTION = "production";

const HEADER_KEY_REFERER = "Referer";

export async function stat(path) {
  let stats;
  try {
    stats = await Deno.stat(path);
  } catch {
    stats = {};
  }
  return stats;
}

export function isDenoScript(pathname) {
  const pathExtName = extname(pathname);
  return DENO_EXTNAMES.indexOf(pathExtName) >= 0;
}

export async function getIndexApp(pathname) {
  const indexAppPath = join(CWD, pathname);
  const stats = await stat(indexAppPath);
  if (stats.isDirectory) {
    return await getIndexScript(indexAppPath);
  } else if (!stats.isFile && indexAppPath.endsWith(DEFAULT_APP_INDEX_HTML)) {
    return await getIndexScript(dirname(indexAppPath));
  }
  return;
}

async function getIndexScript(indexAppPath) {
  const indexAppScriptNamePath = join(indexAppPath, DEFAULT_APP_INDEX);
  let indexAppScriptPath;
  let indexAppScriptStats;
  for (const ext of DENO_EXTNAMES) {
    const scriptPath = format({ name: indexAppScriptNamePath, ext });
    const stats = await stat(scriptPath);
    if (stats.isFile) {
      indexAppScriptPath = format({ dir: ".", name: DEFAULT_APP_INDEX, ext });
      indexAppScriptStats = stats;
      break;
    }
  }
  return { path: indexAppScriptPath, stats: indexAppScriptStats };
}

export function getModeFromSearchParams(searchParams, modeKey) {
  return searchParams.has(modeKey) && searchParams.get(modeKey) !== "false"
    ? modeKey
    : undefined;
}

export function getMode(request) {
  const urlSearchParams = request.url.searchParams;
  let mode =
    getModeFromSearchParams(urlSearchParams, MODE_DEV) ||
    getModeFromSearchParams(urlSearchParams, MODE_PRODUCTION);
  if (!mode && request.headers.has(HEADER_KEY_REFERER)) {
    const referer = request.headers.get(HEADER_KEY_REFERER);
    const refererSearchParams = new URL(referer).searchParams;
    mode =
      getModeFromSearchParams(refererSearchParams, MODE_DEV) ||
      getModeFromSearchParams(refererSearchParams, MODE_PRODUCTION);
  }
  return mode;
}

export async function getContextPath(cookies) {
  return (await cookies.get(CONTEXT_PATH_KEY)) || "";
}

export async function setContextPath(cookies, contextPath) {
  await cookies.set(CONTEXT_PATH_KEY, contextPath, { path: contextPath });
}
