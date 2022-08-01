import { join } from "https://deno.land/std/path/mod.ts";
import { getContextPath, getMode, stat } from "./Util.js";

const CWD = Deno.cwd();
const DEFAULT_SETTINGS_CONFIG_FILE = "settings.js";
const CACHED_CONTEXT_SETTINGS_OPTIONS_MAP = new Map();

export const defaultSettings = {
  mode: undefined,
  excludes: ["**/static/**/*"],
};

export async function getSettingsOptions(contextPath) {
  let options;
  const configFilePath = join(CWD, contextPath, DEFAULT_SETTINGS_CONFIG_FILE);
  if (!CACHED_CONTEXT_SETTINGS_OPTIONS_MAP.has(contextPath)) {
    let stats = await stat(configFilePath);
    let actualConfigFilePath = configFilePath;
    if (contextPath && !stats.isFile) {
      actualConfigFilePath = join(CWD, DEFAULT_SETTINGS_CONFIG_FILE);
      stats = await stat(actualConfigFilePath);
    }
    if (stats.isFile) {
      try {
        const fileResult = await import(protocolFilePath(actualConfigFilePath));
        const configOpitons = { ...fileResult.default };

        options = configOpitons;
      } catch {}
    } else {
      options = {};
    }
    CACHED_CONTEXT_SETTINGS_OPTIONS_MAP.set(contextPath, {
      options: { ...options },
      mtime: stats.mtime,
    });
  } else {
    options = {
      ...CACHED_CONTEXT_SETTINGS_OPTIONS_MAP.get(contextPath).options,
    };
  }

  return options;
}

export function mergeSettings(options, mode, contextPath) {
  const argsSettings = {};
  if (options.mode) argsSettings.mode = options.mode;
  const appSettings = getSettingsOptions(contextPath);
  return Object.assign(defaultSettings, { mode }, argsSettings, appSettings);
}

export default (options) => async (context, next) => {
  const mode = getMode(context.request, false);
  const contextPath = await getContextPath(context.cookies);
  context.settings = mergeSettings(options, mode, contextPath);
  await next();
};
