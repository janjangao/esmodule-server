import { join } from "https://deno.land/std/path/mod.ts";
import babelPluginTransformReactJsx from "../esm.sh/@babel:plugin-transform-react-jsx.js";
import pluginImportModeParams from "./plugin-import-mode-params.js";

const CWD = Deno.cwd();
const DEFAULT_BABEL_CONFIG_FILE = "babel.config.js";
const DEFAULT_BABEL_OPTIONS = {
  plugins: [babelPluginTransformReactJsx],
  babelHelpers: "bundled",
};
const DEFAULT_APP_INDEX = "index.js";
const DEFAULT_ROLLUP_CONFIG_FILE = "rollup.config.js";
const DEFAULT_BABEL_OPTIONS_OUTPUT_DIR = "dist";

const MODE_DEV = "dev";
const MODE_PRODUCTION = "production";

const CACHED_CONTEXT_BABEL_OPTIONS_MAP = new Map();
const CACHED_CONTEXT_ROLLUP_OPTIONS_MAP = new Map();

export async function stat(path) {
  let stats;
  try {
    stats = await Deno.stat(path);
  } catch {
    stats = {};
  }
  return stats;
}

export async function getBabelOptions(contextPath, mode) {
  let options;
  const configFilePath = join(CWD, contextPath, DEFAULT_BABEL_CONFIG_FILE);
  if (!CACHED_CONTEXT_BABEL_OPTIONS_MAP.has(configFilePath)) {
    let stats = await stat(configFilePath);
    let actualConfigFilePath = configFilePath;
    if (contextPath && !stats.isFile) {
      actualConfigFilePath = join(CWD, DEFAULT_BABEL_CONFIG_FILE);
      stats = await stat(actualConfigFilePath);
    }
    if (stats.isFile) {
      try {
        const fileResult = await import(actualConfigFilePath);
        const configOpitons = { ...fileResult.default };
        if (configOpitons.plugins) {
          configOpitons.plugins = [
            ...DEFAULT_BABEL_OPTIONS.plugins,
            ...configOpitons.plugins,
          ];
        } else {
          configOpitons.plugins = [...DEFAULT_BABEL_OPTIONS.plugins];
        }
        options = configOpitons;
      } catch {}
    } else {
      options = { ...DEFAULT_BABEL_OPTIONS };
    }
    CACHED_CONTEXT_BABEL_OPTIONS_MAP.set(actualConfigFilePath, {
      options: { ...options },
      mtime: stats.mtime,
    });
  } else {
    options = {
      ...CACHED_CONTEXT_BABEL_OPTIONS_MAP.get(configFilePath).options,
    };
  }

  if (mode === MODE_DEV) {
    options.sourceMaps = "inline";
    options.plugins = [
      ...options.plugins,
      [pluginImportModeParams, { dev: true }],
    ];
  } else if (mode === MODE_PRODUCTION) {
    options.plugins = [
      ...options.plugins,
      [pluginImportModeParams, { bundle: true }],
    ];
  }
  return options;
}

export async function getRollupOptions(
  contextPath,
  indexFile = DEFAULT_APP_INDEX
) {
  let options;
  const configFilePath = join(CWD, contextPath, DEFAULT_ROLLUP_CONFIG_FILE);
  if (!CACHED_CONTEXT_ROLLUP_OPTIONS_MAP.has(configFilePath)) {
    const babelOptions = await getBabelOptions(contextPath);
    const inputFilePath = join("./", contextPath, indexFile);
    const outputDirPath = join(
      "./",
      contextPath,
      DEFAULT_BABEL_OPTIONS_OUTPUT_DIR
    );
    const defaultRollupOptions = {
      input: inputFilePath,
      output: {
        dir: outputDirPath,
        format: "es",
      },
      plugins: [babel(babelOptions)],
      external() {
        return id.startsWith("https://");
      },
    };
    let stats = await stat(configFilePath);
    let actualConfigFilePath = configFilePath;
    if (contextPath && !stats.isFile) {
      actualConfigFilePath = join(CWD, DEFAULT_ROLLUP_CONFIG_FILE);
      stats = await stat(actualConfigFilePath);
    }
    if (stats.isFile) {
      try {
        const fileResult = await import(actualConfigFilePath);
        configOpitons = { ...fileResult.default };
        configOpitons.input = defaultRollupOptions.input;
        configOpitons.output = defaultRollupOptions.output;
        if (configOpitons.plugins) {
          configOpitons.plugins = [
            ...defaultRollupOptions.plugins,
            ...configOpitons.plugins,
          ];
        } else {
          configOpitons.plugins = [...defaultRollupOptions.plugins];
        }
        options = configOpitons;
        CACHED_CONTEXT_ROLLUP_OPTIONS_MAP.set(actualConfigFilePath, {
          options: { ...options },
          mtime: stats.mtime,
        });
      } catch {}
    } else {
      options = { ...defaultRollupOptions };
    }
  } else {
    options = {
      ...CACHED_CONTEXT_ROLLUP_OPTIONS_MAP.get(configFilePath).options,
    };
  }
  return options;
}
