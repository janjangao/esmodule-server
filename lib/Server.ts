import type { Middleware, ListenOptions } from "https://deno.land/x/oak/mod.ts";

import { Application, Router } from "https://deno.land/x/oak/mod.ts";
import { parse } from "https://deno.land/std/flags/mod.ts";
import SettingsMiddleware from "./middleware/SettingsMiddleware.js";
import DenoContentTypeMiddleware from "./middleware/DenoContentTypeMiddleware.js";
import BabelTransformMiddleware from "./middleware/BabelTransformMiddleware.js";
import IndexAppMiddleware from "./middleware/IndexAppMiddleware.js";

const CWD = Deno.cwd();

export default class Server {
  app = new Application();
  router = new Router();
  port = 8000;
  indexAppFlag = true;

  disableIndexApp() {
    this.indexAppFlag = false;
  }

  use(middleware: Middleware) {
    this.app.use(middleware);
  }

  routerMiddlewares() {
    this.app.use(this.router.routes());
    this.app.use(this.router.allowedMethods());
  }

  async run(options?: ListenOptions) {
    this.routerMiddlewares();

    this.app.use(SettingsMiddleware(parse(Deno.args)));
    this.app.use(DenoContentTypeMiddleware);
    this.app.use(BabelTransformMiddleware);
    if (this.indexAppFlag) this.app.use(IndexAppMiddleware);

    if (this.indexAppFlag)
      this.app.use(async (context, next) => {
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
    await this.app.listen({ port: this.port, ...options });
  }
}

export const server = new Server();
