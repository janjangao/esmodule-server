var __defProp = Object.defineProperty;
var __getOwnPropSymbols = Object.getOwnPropertySymbols;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __propIsEnum = Object.prototype.propertyIsEnumerable;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __spreadValues = (a, b) => {
  for (var prop in b || (b = {}))
    if (__hasOwnProp.call(b, prop))
      __defNormalProp(a, prop, b[prop]);
  if (__getOwnPropSymbols)
    for (var prop of __getOwnPropSymbols(b)) {
      if (__propIsEnum.call(b, prop))
        __defNormalProp(a, prop, b[prop]);
    }
  return a;
};

// transform.ts
import "https://unpkg.com/source-map@0.7.3/dist/source-map.js";
import "https://unpkg.com/terser@5.7.1/dist/bundle.min.js";
var minify = globalThis.Terser.minify;
delete globalThis.Terser;
var transform = async (code, options) => {
  const result = await minify(code, options);
  return {
    result,
    nameCache: options?.nameCache
  };
};

// mod.ts
function terser(options = {}) {
  return {
    name: "terser",
    async renderChunk(code, _chunk, outputOptions) {
      const defaultOptions = {
        sourceMap: outputOptions.sourcemap === true || typeof outputOptions.sourcemap === "string"
      };
      if (outputOptions.format === "es") {
        defaultOptions.module = true;
      } else if (outputOptions.format === "cjs") {
        defaultOptions.toplevel = true;
      }
      const normalizedOptions = __spreadValues(__spreadValues({}, defaultOptions), options);
      delete normalizedOptions.numWorkers;
      let result;
      try {
        result = await transform(code, normalizedOptions);
        if (result.nameCache) {
          const resultNameCache = result.nameCache;
          let { vars, props } = options.nameCache ?? {};
          if (vars) {
            const newVars = resultNameCache?.vars?.props;
            if (newVars) {
              vars.props = vars.props || {};
              Object.assign(vars.props, newVars);
            }
          }
          if (!props) {
            options.nameCache = {};
            props = options.nameCache.props = {};
          }
          const newProps = resultNameCache?.props?.props;
          if (newProps) {
            props.props = props.props || {};
            Object.assign(props.props, newProps);
          }
        }
      } catch (error) {
        throw error;
      }
      return result.result;
    }
  };
}
export {
  terser
};
