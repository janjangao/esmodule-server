import { build, stop } from "https://deno.land/x/esbuild@v0.12.1/mod.js";

await build({
  minify: true,
  entryPoints: ["bundle.js"],
  outfile: "bundle.min.js",
});

stop();