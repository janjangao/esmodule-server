import { MiddlewareClazz, State, Context } from "./types.ts";

export default class Middleware<S extends State> implements MiddlewareClazz<S> {
  disabled = false;

  do(_context: Context<S>, _next: () => Promise<any>) {}
  bindDo() {
    return this.do.bind(this);
  }
}
