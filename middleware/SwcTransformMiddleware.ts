import type { State, Context } from "./types.ts";
import type { swcOptions } from "../deps.ts";
import Middleware from "./Middleware.ts";
import { swcInit, transform, readAll, extname } from "../deps.ts";

export default class SwcTransformMiddleware<
  S extends State = Record<string, any>
> extends Middleware<S> {
  #swcInited = false;
  #swcInitPromise: Promise<any> | undefined;

  extnames = [".jsx", ".ts", ".tsx"];
  textDecoder = new TextDecoder();
  swcOptions: swcOptions = {
    jsc: {
      parser: {
        syntax: "typescript",
        tsx: true,
      },
    },
    minify: false,
  };

  constructor() {
    super();
    this.#swcInitPromise = swcInit();
  }

  isTransformedScript(pathname: string) {
    const pathExtName = extname(pathname);
    return this.extnames.indexOf(pathExtName) >= 0;
  }

  async bodyToContent(body: Uint8Array | Deno.FsFile) {
    if (body instanceof Uint8Array) {
      return this.textDecoder.decode(body);
    } else if (body instanceof Deno.FsFile) {
      const buffer = await readAll(body);
      body.close();
      return this.textDecoder.decode(buffer);
    }
  }

  async transformBody(body: Uint8Array | Deno.FsFile) {
    if (!this.#swcInited) {
      await this.#swcInitPromise;
      this.#swcInited = true;
      this.#swcInitPromise = undefined;
    }
    const content = await this.bodyToContent(body);
    if (content) {
      const { code } = await transform(content, this.swcOptions);
      return code;
    }
    return body;
  }

  async do(context: Context<S>, next: () => Promise<any>) {
    const pathname = context.request.url.pathname;
    await next();
    const body = context.response.body;
    if (
      this.isTransformedScript(pathname) &&
      (body instanceof Uint8Array || body instanceof Deno.FsFile)
    ) {
      try {
        context.response.body = await this.transformBody(body);
      } catch {
        /* noop */
      }
    }
  }
}
