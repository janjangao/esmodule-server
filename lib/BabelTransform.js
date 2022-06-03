import { join } from "https://deno.land/std/path/mod.ts";
import babelCore from "../esm.sh/@babel:core.js";
import { getBabelOptions } from "./Options.js";

export async function transformAsync(code, contextPath = '', isDev = false) {
  const options = getBabelOptions(contextPath);
  if (isDev) {
    options.sourceMaps = "inline";
  }
  return await babelCore.transformAsync(code, options);
}
