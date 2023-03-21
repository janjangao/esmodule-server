import type { State, ListenOptions } from "./deps.ts";
import { OakApplication } from "./deps.ts";
import RootStaticMiddleware from "./middleware/RootStaticMiddleware.ts";
import SwcTransformMiddleware from "./middleware/SwcTransformMiddleware.ts";

export default class Application<
  S extends State = Record<string, any>
> extends OakApplication<S> {
  rootStaticMiddleware = new RootStaticMiddleware<S>();
  swcTransformMiddleware = new SwcTransformMiddleware<S>();

  #applyMiddleware() {
    if (!this.rootStaticMiddleware.disabled)
      this.use(this.rootStaticMiddleware.bindDo());
    if (!this.swcTransformMiddleware.disabled)
      this.use(this.swcTransformMiddleware.bindDo());
  }

  listen(options: string | ListenOptions = { port: 0 }): Promise<void> {
    this.#applyMiddleware();
    return typeof options === "string"
      ? super.listen(options)
      : super.listen(options);
  }
}
