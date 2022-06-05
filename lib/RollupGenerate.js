import { rollup } from "../esm.sh/drollup.js";
import { getRollupOptions } from "./Options.js";

export async function generateAsync(inputFilePath) {
  const options = await getRollupOptions(inputFilePath);
  const bundle = await rollup(options);
  await bundle.write(options.output);
  await bundle.close();
}
