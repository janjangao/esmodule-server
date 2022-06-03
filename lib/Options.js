import babelPluginTransformReactJsx from "../esm.sh/@babel:plugin-transform-react-jsx.js";

const CWD = Deno.cwd();
const DEFAULT_BABEL_CONFIG_FILE = "babel.config.js";
const DEFAULT_BABEL_OPTIONS = {
  plugins: [babelPluginTransformReactJsx],
  babelHelpers: "bundled",
};
const DEFAULT_APP_INDEX = "index.js";
const DEFAULT_ROLLUP_CONFIG_FILE = "rollup.config.js";
const DEFAULT_BABEL_OPTIONS_OUTPUT_DIR = "dist";

export async function getBabelOptions(contextPath) {
  const configFilePath = join(CWD, contextPath, DEFAULT_BABEL_CONFIG_FILE);
  let options = DEFAULT_BABEL_OPTIONS;
  try {
    const fileResult = await import(configFilePath);
    options = fileResult.default;
    if (options.plugins) {
      options.plugins = [...DEFAULT_BABEL_OPTIONS.plugins, ...options.plugins];
    } else {
      options.plugins = DEFAULT_BABEL_OPTIONS.plugins;
    }
  } catch (e) {
    options = DEFAULT_BABEL_OPTIONS;
  }
  return options;
}

export async function getRollupOptions(contextPath, indexFile = DEFAULT_APP_INDEX) {
  const babelOptions = getBabelOptions(contextPath);
  const configFilePath = join(CWD, contextPath, DEFAULT_ROLLUP_CONFIG_FILE);
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
  try {
    const fileResult = await import(configFilePath);
    options = fileResult.default;
    options.input = defaultRollupOptions.input;
    options.output = defaultRollupOptions.output;
    if (options.plugins) {
      options.plugins = [...defaultRollupOptions.plugins, ...options.plugins];
    } else {
      options.plugins = defaultRollupOptions.plugins;
    }
  } catch (e) {
    options = defaultRollupOptions;
  }
  return options;
}
