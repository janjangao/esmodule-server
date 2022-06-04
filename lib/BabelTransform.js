import babelCore from "../esm.sh/@babel:core.js";
import { getBabelOptions } from "./Options.js";

export async function transformAsync(code, contextPath, mode) {
  const options = await getBabelOptions(contextPath, mode);
  return await babelCore.transformAsync(code, options);
}
