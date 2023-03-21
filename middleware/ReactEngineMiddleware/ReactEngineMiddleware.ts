import { State, Context } from "../types.ts";
import Middleware from "../Middleware.ts";

export default class ReactEngineMiddleware<
  S extends State = Record<string, any>
> extends Middleware<S> {
  root = Deno.cwd();

  async do(context: Context<S>, next: () => Promise<any>) {}
}
