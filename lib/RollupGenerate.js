import { rollup } from "../esm.sh/drollup.js";
import { babel } from "../esm.sh/@rollup:plugin-babel.js";
import { getRollupOptions } from "./Options.js";

export async function generateAsync(indexFile, contextPath = "") {
  const options = getRollupOptions(contextPath, indexFile);
  const bundle = await rollup(options);
  await bundle.write(options.output);
  await bundle.close();
}
