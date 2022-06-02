import { Application } from "https://deno.land/x/oak/mod.ts";
import DenoContentTypeMiddleware from "./lib/middleware/DenoContentTypeMiddleware.js";
import BabelTransformMiddleware from "./lib/middleware/BabelTransformMiddleware.js";

const CWD = Deno.cwd();

const app = new Application();

app.use(DenoContentTypeMiddleware);
app.use(BabelTransformMiddleware);

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
