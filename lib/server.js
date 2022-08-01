import { Application } from "https://deno.land/x/oak/mod.ts";
import { parse } from "https://deno.land/std/flags/mod.ts";
import SettingsMiddleware from "./middleware/SettingsMiddleware.js";
import DenoContentTypeMiddleware from "./middleware/DenoContentTypeMiddleware.js";
import BabelTransformMiddleware from "./middleware/BabelTransformMiddleware.js";
import IndexAppMiddleware from "./middleware/IndexAppMiddleware.js";

const CWD = Deno.cwd();

const app = new Application();

app.use(SettingsMiddleware(parse(Deno.args)));
app.use(DenoContentTypeMiddleware);
app.use(BabelTransformMiddleware);
app.use(IndexAppMiddleware);

app.use(async (context, next) => {
  try {
    await context.send({
      root: CWD,
      index: "index.html",
    });
    await next();
  } catch {
    await next();
  }
});

await app.listen({ port: 8000 });
