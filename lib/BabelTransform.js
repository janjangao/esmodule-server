import babelCore from "../esm.sh/@babel:core.js";
import babelPluginTransformReactJsx from "../esm.sh/@babel:plugin-transform-react-jsx.js";
import { join } from "https://deno.land/std/path/mod.ts";

const CWD = Deno.cwd();
const DEFAULT_CONFIG_FILE = "babel.config.js";
const DEFAULT_OPTIONS = {
  plugins: [babelPluginTransformReactJsx],
};

export async function transformAsync(code, contextPath = '', isDev = false) {
  const configFilePath = join(CWD, contextPath, DEFAULT_CONFIG_FILE);
  let options = DEFAULT_OPTIONS;
  try {
    const fileResult = await import(configFilePath);
    options = fileResult.default;
    if (options.plugins) {
      options.plugins.push(babelPluginTransformReactJsx);
    } else {
      options.plugins = DEFAULT_OPTIONS;
    }
  } catch (e) {
    options = DEFAULT_OPTIONS;
  }
  if (isDev) {
    options.sourceMaps = "inline";
  }
  return await babelCore.transformAsync(code, options);
}
