import { readAll } from "https://deno.land/std@0.142.0/streams/conversion.ts";
import { isDenoScript, isIgnoreScript, getContextPath, getMode } from "./Util.js";
import { transformAsync } from "../BabelTransform.js";

export default async (context, next) => {
  const pathname = context.request.url.pathname;
  const isIgnore = isIgnoreScript(pathname);
  const isDeno = isDenoScript(pathname);
  await next();
  const body = context.response.body;
  if (isIgnore || !isDeno || body === undefined) return;
  let buffer = body;
  if (body instanceof Deno.FsFile) {
    buffer = await readAll(body);
    body.close();
  }
  const content = new TextDecoder().decode(buffer);
  try {
    const mode = getMode(context.request);
    const contextPath = await getContextPath(context.cookies);
    const { code } = await transformAsync(content, contextPath, mode);
    context.response.body = code;
  } catch (e) {
    context.response.body = e.message;
  }
};
