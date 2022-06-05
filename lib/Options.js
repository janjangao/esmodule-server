import { join, relative, dirname } from "https://deno.land/std/path/mod.ts";
import babelPluginTransformReactJsx from "../esm.sh/@babel:plugin-transform-react-jsx.js";
import babelPluginTransformTypescript from "../esm.sh/@babel:plugin-transform-typescript.js";
import pluginImportModeParams from "./plugin-import-mode-params.js";
import rollupPluginBabel from "../esm.sh/@rollup:plugin-babel.js";
import { terser as rollupPluginTerser } from "../esm.sh/@rollup:plugin-terser.js";
// import typescript from "https://esm.sh/@rollup/plugin-typescript";
const CWD = Deno.cwd();
const LINK_PREFIX = "https://";
const DEFAULT_BABEL_CONFIG_FILE = "babel.config.js";
const DEFAULT_BABEL_OPTIONS = {
  plugins: [
    babelPluginTransformReactJsx,
    [babelPluginTransformTypescript, { isTSX: true }],
  ],
};
const DEFAULT_ROLLUP_CONFIG_FILE = "rollup.config.js";
const DEFAULT_ROLLUP_OPTIONS_OUTPUT_DIR = "dist";
const DEFAULT_ROLLUP_OPTIONS_OUTPUT_PLUGINS = [rollupPluginTerser()];
const DEFAULT_ROLLUP_OPTIONS_BABEL_EXTENSIONS = [".js", ".jsx", ".ts", ".tsx"];
const DEFAULT_ROLLUP_OPTIONS_BABEL_BABELHELPERS = "bundled";

const MODE_DEV = "dev";
const MODE_PRODUCTION = "production";
const MODE_PRODUCTION_ROLLUP = "production_rollup";

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
  if (!CACHED_CONTEXT_BABEL_OPTIONS_MAP.has(contextPath)) {
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
    CACHED_CONTEXT_BABEL_OPTIONS_MAP.set(contextPath, {
      options: { ...options },
      mtime: stats.mtime,
    });
  } else {
    options = {
      ...CACHED_CONTEXT_BABEL_OPTIONS_MAP.get(contextPath).options,
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
  } else if (mode === MODE_PRODUCTION_ROLLUP) {
    options.plugins = [
      ...options.plugins,
      [
        pluginImportModeParams,
        { bundle: true, onlyLink: true, linkPrefix: LINK_PREFIX },
      ],
    ];
  }
  return options;
}

export async function getRollupOptions(inputFilePath) {
  let options;
  const contextPath = join("/", relative(CWD, dirname(inputFilePath)));
  if (!CACHED_CONTEXT_ROLLUP_OPTIONS_MAP.has(contextPath)) {
    const configFilePath = join(CWD, contextPath, DEFAULT_ROLLUP_CONFIG_FILE);
    const babelOptions = await getBabelOptions(
      contextPath,
      MODE_PRODUCTION_ROLLUP
    );
    babelOptions.babelHelpers = DEFAULT_ROLLUP_OPTIONS_BABEL_BABELHELPERS;
    babelOptions.extensions = DEFAULT_ROLLUP_OPTIONS_BABEL_EXTENSIONS;
    const outputDirPath = join(
      "./",
      contextPath,
      DEFAULT_ROLLUP_OPTIONS_OUTPUT_DIR
    );
    const defaultRollupOptions = {
      input: inputFilePath,
      output: {
        dir: outputDirPath,
        format: "es",
      },
      plugins: [
        rollupPluginBabel(babelOptions),
        ...DEFAULT_ROLLUP_OPTIONS_OUTPUT_PLUGINS,
      ],
      external(id) {
        return id.startsWith(LINK_PREFIX);
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
        CACHED_CONTEXT_ROLLUP_OPTIONS_MAP.set(contextPath, {
          options: { ...options },
          mtime: stats.mtime,
        });
      } catch {}
    } else {
      options = { ...defaultRollupOptions };
    }
  } else {
    options = {
      ...CACHED_CONTEXT_ROLLUP_OPTIONS_MAP.get(contextPath).options,
    };
  }
  return options;
}
