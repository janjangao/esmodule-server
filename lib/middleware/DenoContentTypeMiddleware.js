import { isDenoScript } from "./Util.js";

const DENO_CONTENT_TYPE_KEY = "Content-Type";
const DENO_CONTENT_TYPE_VALUE = "application/javascript; charset=utf-8";

export default async (context, next) => {
    const isDeno = isDenoScript(context.request.url.pathname);
    await next();
    if (isDeno) context.response.headers.set(DENO_CONTENT_TYPE_KEY, DENO_CONTENT_TYPE_VALUE);
};