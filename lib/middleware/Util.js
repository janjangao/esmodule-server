import { extname } from "https://deno.land/std@0.142.0/path/mod.ts";

export const DENO_EXTNAMES = [".js", ".jsx", ".ts", ".tsx"];

export function isDenoScript(pathname) {
    const pathExtName = extname(pathname);
    return DENO_EXTNAMES.indexOf(pathExtName) >= 0;
}

export function isDev(searchParams) {
    const dev = searchParams.get('dev');
    return dev !== null && dev !== 'false';
}