import { readAll } from "https://deno.land/std@0.142.0/streams/conversion.ts";
import { isDenoScript, isDev } from "./Util.js";
import { transformAsync } from "../BabelTransform.js";

export default async (context, next) => {
    const pathname = context.request.url.pathname;
    const isDeno = isDenoScript(pathname);
    // TODO
    const contextPath = '';
    await next();
    const body = context.response.body;
    if (!isDeno || body === undefined) return;
    let buffer = body;
    if (body instanceof Deno.FsFile) {
        buffer = await readAll(body);
        body.close();
    }
    const content = new TextDecoder().decode(buffer);
    try {
        const dev = isDev(context.request.url.searchParams);
        const { code } = await transformAsync(content, contextPath, dev);
        context.response.body = code;
    } catch (e) {
        context.response.body = e.message;
    }
};