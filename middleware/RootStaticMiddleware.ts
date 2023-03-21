import { State, Context } from "./types.ts";
import Middleware from "./Middleware.ts";

export default class RootStaticMiddleware<
  S extends State = Record<string, any>
> extends Middleware<S> {
  root = Deno.cwd();

  async do(context: Context<S>, next: () => Promise<any>) {
    try {
      await context.send({
        root: this.root,
        contentTypes: {
          ".tsx": "application/javascript",
          ".ts": "application/javascript",
          ".jsx": "application/javascript",
        },
      });
      await next();
    } catch {
      await next();
    }
  }
}
