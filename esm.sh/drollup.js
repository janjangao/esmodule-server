var __defProp = Object.defineProperty;
var __defProps = Object.defineProperties;
var __getOwnPropDescs = Object.getOwnPropertyDescriptors;
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
var __spreadProps = (a, b) => __defProps(a, __getOwnPropDescs(b));
var __objRest = (source, exclude) => {
  var target = {};
  for (var prop in source)
    if (__hasOwnProp.call(source, prop) && exclude.indexOf(prop) < 0)
      target[prop] = source[prop];
  if (source != null && __getOwnPropSymbols)
    for (var prop of __getOwnPropSymbols(source)) {
      if (exclude.indexOf(prop) < 0 && __propIsEnum.call(source, prop))
        target[prop] = source[prop];
    }
  return target;
};

// deps.ts
import {
  basename,
  dirname,
  extname,
  fromFileUrl,
  isAbsolute,
  join,
  normalize,
  relative,
  resolve,
  sep,
  toFileUrl
} from "https://deno.land/std@0.110.0/path/mod.ts";
import {
  bold,
  cyan,
  dim,
  green,
  red,
  underline
} from "https://deno.land/std@0.110.0/fmt/colors.ts";
import { EventEmitter } from "./lib/node_events";
import {
  rollup,
  VERSION
} from "./rollup.js";
import { Command } from "https://deno.land/x/cliffy@v0.19.6/command/mod.ts";
import * as Cache from "https://deno.land/x/cache@0.2.13/mod.ts";
import { default as default2 } from "https://cdn.esm.sh/v43/ms@2.1.3/deno/ms.js";
import { default as default3 } from "./picomatch.js";

// src/rollup/supportUrlSources.ts
var RE_PATH_MALFORMED_HTTP_URL = /(.*)(https?:\/)([^\/]?)/;
var RE_PATH_MALFORMED_FILE_URL = /(.*)(file:\/)([^\/]?)/;
function supportUrlSources(options) {
  return __spreadProps(__spreadValues({}, options), {
    sourcemapPathTransform(relativeSourcePath, sourcemapPath) {
      if (RE_PATH_MALFORMED_HTTP_URL.test(relativeSourcePath)) {
        relativeSourcePath = relativeSourcePath.replace(RE_PATH_MALFORMED_HTTP_URL, "$2/$3");
      } else if (RE_PATH_MALFORMED_FILE_URL.test(relativeSourcePath)) {
        relativeSourcePath = relativeSourcePath.replace(RE_PATH_MALFORMED_FILE_URL, "$2//$3");
      }
      sourcemapPath = normalize(sourcemapPath);
      return options.sourcemapPathTransform ? options.sourcemapPathTransform(relativeSourcePath, sourcemapPath) : relativeSourcePath;
    }
  });
}

// src/rollup/getDestination.ts
function getDestination(options) {
  const { dir, file } = options;
  if (dir) {
    return resolve(dir);
  } else if (file) {
    return resolve(dirname(file));
  }
  return null;
}

// src/relativeId.ts
function relativeId(id) {
  if (!isAbsolute(id)) {
    return id;
  }
  return relative(Deno.cwd(), id);
}

// src/logging.ts
var logInfo = console.error.bind(console);
var logError = console.error.bind(console);
var logOutput = console.log.bind(console);
function handleError(err, recover = false) {
  let message = err.message || err;
  if (err.name) {
    message = `${err.name}: ${message}`;
  }
  logError(bold(red(`[!] ${bold(message.toString())}`)));
  if (err.url) {
    logError(cyan(err.url));
  }
  if (err.loc) {
    logError(`${relativeId(err.loc.file || err.id)} (${err.loc.line}:${err.loc.column})`);
  } else if (err.id) {
    logError(relativeId(err.id));
  }
  if (err.frame) {
    logError(dim(err.frame));
  }
  if (err.stack) {
    logError(dim(err.stack));
  }
  logError("");
  if (!recover) {
    Deno.exit(1);
  }
}

// src/rollup/write.ts
var SOURCEMAPPING_URL = "sourceMappingURL";
async function write(options) {
  options = supportUrlSources(options);
  const rollupOutput = await this.generate(options);
  const destination = getDestination(options);
  if (!destination) {
    throw handleError({
      message: `you must specify "output.file" or "output.dir" for the build`
    });
  }
  for (const outputFile of rollupOutput.output) {
    const fullPath = join(destination, outputFile.fileName);
    await Deno.mkdir(dirname(fullPath), { recursive: true });
    let source;
    if (outputFile.type === "asset") {
      source = outputFile.source;
    } else {
      source = outputFile.code;
      if (options.sourcemap && outputFile.map) {
        let url;
        if (options.sourcemap === "inline") {
          url = outputFile.map.toUrl();
        } else {
          url = `${outputFile.fileName}.map`;
          await Deno.writeTextFile(`${fullPath}.map`, JSON.stringify(outputFile.map));
        }
        if (options.sourcemap !== "hidden") {
          source += `//# ${SOURCEMAPPING_URL}=${url}
`;
        }
      }
    }
    if (typeof source === "string") {
      await Deno.writeTextFile(fullPath, source);
    } else {
      await Deno.writeFile(fullPath, source);
    }
  }
  return rollupOutput;
}

// src/rollup/generate.ts
async function generate(options) {
  options = supportUrlSources(options);
  return await this.generate(options);
}

// src/rollup-plugin-deno-resolver/getUrlBase.ts
function getUrlBase() {
  return toFileUrl(join(Deno.cwd(), sep));
}

// src/rollup-plugin-deno-resolver/parse.ts
function parse(id) {
  if (isAbsolute(id)) {
    return toFileUrl(id);
  }
  try {
    return new URL(id);
  } catch {
  }
  try {
    return new URL(id, getUrlBase());
  } catch {
    return null;
  }
}

// src/rollup-plugin-deno-resolver/isTypescript.ts
var RE_TS = /\.tsx?$/;
function isTypescript(source) {
  return RE_TS.test(source);
}

// src/rollup-plugin-deno-resolver/ensureUrl.ts
var RE_URL = /^(https?|file):\/\//;
var RE_PATH_MALFORMED_HTTP_URL2 = /^((https?):)(?:\\+|\/)/;
var RE_PATH_MALFORMED_FILE_URL2 = /^((file):)(?:\\+|\/)([A-Za-z]:)?/;
function ensureUrl(source) {
  if (RE_URL.test(source)) {
    return source;
  } else if (RE_PATH_MALFORMED_HTTP_URL2.test(source)) {
    return source.replace(RE_PATH_MALFORMED_HTTP_URL2, "$1//").replace(/\\/g, "/");
  } else if (RE_PATH_MALFORMED_FILE_URL2.test(source)) {
    return source.replace(RE_PATH_MALFORMED_FILE_URL2, "$1///$3").replace(/\\/g, "/");
  }
  return null;
}

// src/rollup-plugin-deno-resolver/resolveId.ts
var RE_HTTP_URL = /^(https?):\/\//;
var RE_WIN_DEVICE = /^([A-Za-z]:)(\\+|\/)/;
function resolveId(source, importer) {
  const sourceUrl = ensureUrl(source);
  if (sourceUrl) {
    return sourceUrl;
  }
  source = normalize(source);
  if (importer) {
    const importerUrl = ensureUrl(importer);
    if (importerUrl) {
      const devicelessSource = source.replace(RE_WIN_DEVICE, "$2");
      const url = new URL(devicelessSource, importerUrl);
      return RE_HTTP_URL.test(url.href) ? url.href : fromFileUrl(url);
    }
    if (isAbsolute(source)) {
      return source;
    }
    return join(dirname(importer), source);
  }
  return source;
}

// src/notImplemented.ts
function notImplemented(msg) {
  const message = msg ? `Not implemented: ${msg}` : "Not implemented";
  throw handleError({ message });
}

// src/rollup-plugin-deno-resolver/exists.ts
async function exists(url, fetchOpts) {
  switch (url.protocol) {
    case "file:": {
      try {
        const { isFile } = await Deno.stat(url);
        return isFile;
      } catch {
        return false;
      }
    }
    case "http:":
    case "https:": {
      try {
        const res = await fetch(url.href, fetchOpts);
        await res.arrayBuffer();
        return res.ok;
      } catch {
        return false;
      }
    }
    default: {
      return notImplemented(`support for protocol '${url.protocol}'`);
    }
  }
}

// src/rollup-plugin-deno-resolver/loadUrl.ts
var decoder = new TextDecoder("utf-8");
async function loadUrl(url, fetchOpts) {
  switch (url.protocol) {
    case "file:": {
      const out = await Deno.readFile(url);
      return decoder.decode(out);
    }
    case "http:":
    case "https:": {
      try {
        const file = await Cache.cache(url.href);
        return await Deno.readTextFile(file.path);
      } catch {
        const res = await fetch(url.href, fetchOpts);
        return await res.text();
      }
    }
    default: {
      return notImplemented(`support for protocol '${url.protocol}'`);
    }
  }
}

// src/error.ts
function error(base) {
  if (!(base instanceof Error)) {
    base = Object.assign(new Error(base.message), base);
  }
  throw base;
}

// src/rollup-plugin-deno-resolver/handleUnresolvedId.ts
function handleUnresolvedId(id, importer) {
  if (importer !== void 0) {
    return null;
  }
  error({
    code: "UNRESOLVED_ENTRY",
    message: `Could not resolve entry module (${relativeId(id)}).`
  });
}

// src/rollup-plugin-deno-resolver/denoResolver.ts
function denoResolver({ fetchOpts, compilerOpts } = {}) {
  return {
    name: "rollup-plugin-deno-resolver",
    async resolveId(source, importer) {
      let id = resolveId(source, importer);
      let url = parse(id);
      if (!url) {
        return handleUnresolvedId(id, importer);
      }
      if (!await exists(url, fetchOpts)) {
        id += ".js";
        url = new URL(`${url.href}.js`);
      }
      if (!await exists(url, fetchOpts)) {
        id = id.substr(0, id.length - 3);
        return handleUnresolvedId(id, importer);
      }
      return id;
    },
    async load(id) {
      const url = parse(id);
      if (!url) {
        return null;
      }
      const code = await loadUrl(url, fetchOpts);
      if (isTypescript(url.href)) {
        const outputUrlHref = `${url.href}.js`;
        const { files: { [outputUrlHref]: output } } = await Deno.emit(url, {
          check: false,
          compilerOptions: compilerOpts,
          sources: {
            [url.href]: code
          }
        });
        return output;
      }
      return code;
    }
  };
}

// src/ensureArray.ts
function ensureArray(items) {
  if (Array.isArray(items)) {
    return items.filter(Boolean);
  } else if (items) {
    return [items];
  }
  return [];
}

// src/rollup/rollup.ts
async function rollup2(options) {
  const denoResolverPlugin = denoResolver(options.denoResolver);
  delete options.denoResolver;
  options = __spreadProps(__spreadValues({}, options), {
    plugins: options.plugins ? [
      ...ensureArray(options.plugins),
      denoResolverPlugin
    ] : [denoResolverPlugin]
  });
  try {
    const bundle = await rollup(options);
    return new Proxy(bundle, {
      get: (target, prop, receiver) => {
        const value = Reflect.get(target, prop, receiver);
        if (prop === "write") {
          return write.bind(target);
        } else if (prop === "generate") {
          return generate.bind(target);
        }
        return value;
      }
    });
  } catch (err) {
    if (err?.plugin === denoResolverPlugin.name) {
      const _a = err, { plugin: _plugin, code: _code, pluginCode } = _a, rest = __objRest(_a, ["plugin", "code", "pluginCode"]);
      return error(__spreadValues({
        code: pluginCode
      }, rest));
    }
    throw err;
  }
}

// src/rollup/fileWatcher.ts
var FileWatcher = class {
  constructor(task) {
    this.closed = false;
    this.task = task;
    this.createWatcher();
  }
  close() {
    this.closed = true;
  }
  async createWatcher() {
    const cwd = Deno.cwd();
    const watcher = Deno.watchFs([cwd]);
    for await (const { kind, paths } of watcher) {
      if (this.closed) {
        break;
      } else if (["any", "access"].includes(kind)) {
        continue;
      }
      for (const path of paths) {
        if (this.task.filter(path)) {
          this.task.invalidate({ path, kind });
        }
      }
    }
  }
};

// src/rollup/createFilter.ts
function getMatcherString(id, resolutionBase) {
  if (resolutionBase === false || isAbsolute(id) || id.startsWith("*")) {
    return id;
  }
  const basePath = normalize(resolve(resolutionBase || "")).replace(/[-^$*+?.()|[\]{}]/g, "\\$&");
  return join(basePath, id);
}
function createFilter(include, exclude, options) {
  const resolutionBase = options && options.resolve;
  const getMatcher = (id) => id instanceof RegExp ? id : {
    test: (what) => {
      const pattern = getMatcherString(id, resolutionBase);
      const fn = default3(pattern, { dot: true });
      const result = fn(what);
      return result;
    }
  };
  const includeMatchers = ensureArray(include).map(getMatcher);
  const excludeMatchers = ensureArray(exclude).map(getMatcher);
  return function result(id) {
    if (typeof id !== "string" || /\0/.test(id)) {
      return false;
    }
    const pathId = normalize(id);
    for (let i = 0; i < excludeMatchers.length; ++i) {
      const matcher = excludeMatchers[i];
      if (matcher.test(pathId)) {
        return false;
      }
    }
    for (let i = 0; i < includeMatchers.length; ++i) {
      const matcher = includeMatchers[i];
      if (matcher.test(pathId)) {
        return true;
      }
    }
    return !includeMatchers.length;
  };
}

// src/mergeOptions.ts
var objectifyOptionWithPresets = (presets, optionName, additionalValues) => (value) => {
  if (typeof value === "string") {
    const preset = presets[value];
    if (preset) {
      return preset;
    }
    error({
      code: "INVALID_OPTION",
      message: `Invalid value ${value !== void 0 ? `${JSON.stringify(value)} ` : ""}for option "${optionName}" - valid values are ${additionalValues}${Object.keys(presets).join(", ")}. You can also supply an object for more fine-grained control}.`
    });
  }
  return value && typeof value === "object" ? value : {};
};
var defaultOnWarn = (warning) => console.warn(warning.message || warning);
function warnUnknownOptions(passedOptions, validOptions, optionType, warn, ignoredKeys = /$./) {
  const validOptionSet = new Set(validOptions);
  const unknownOptions = Object.keys(passedOptions).filter((key) => !(validOptionSet.has(key) || ignoredKeys.test(key)));
  if (unknownOptions.length > 0) {
    warn({
      code: "UNKNOWN_OPTION",
      message: `Unknown ${optionType}: ${unknownOptions.join(", ")}. Allowed options: ${[
        ...validOptionSet
      ].sort().join(", ")}`
    });
  }
}
var commandAliases = {
  c: "config",
  d: "dir",
  e: "external",
  f: "format",
  g: "globals",
  h: "help",
  i: "input",
  m: "sourcemap",
  n: "name",
  o: "file",
  p: "plugin",
  v: "version",
  w: "watch"
};
function mergeOptions(config, rawCommandOptions = { external: [], globals: void 0 }, defaultOnWarnHandler = defaultOnWarn) {
  const command = getCommandOptions(rawCommandOptions);
  const inputOptions = mergeInputOptions(config, command, defaultOnWarnHandler);
  const warn = inputOptions.onwarn;
  if (command.output) {
    Object.assign(command, command.output);
  }
  const outputOptionsArray = ensureArray(config.output);
  if (outputOptionsArray.length === 0) {
    outputOptionsArray.push({});
  }
  const outputOptions = outputOptionsArray.map((singleOutputOptions) => mergeOutputOptions(singleOutputOptions, command, warn));
  warnUnknownOptions(command, Object.keys(inputOptions).concat(Object.keys(outputOptions[0]).filter((option) => option !== "sourcemapPathTransform"), Object.keys(commandAliases), "config", "environment", "plugin", "silent", "failAfterWarnings", "stdin", "waitForBundleInput"), "CLI flags", warn, /^_$|output$|config/);
  inputOptions.output = outputOptions;
  return inputOptions;
}
var treeshakePresets = {
  recommended: {
    annotations: true,
    correctVarValueBeforeDeclaration: false,
    moduleSideEffects: () => true,
    propertyReadSideEffects: true,
    tryCatchDeoptimization: true,
    unknownGlobalSideEffects: false
  },
  safest: {
    annotations: true,
    correctVarValueBeforeDeclaration: true,
    moduleSideEffects: () => true,
    propertyReadSideEffects: true,
    tryCatchDeoptimization: true,
    unknownGlobalSideEffects: true
  },
  smallest: {
    annotations: true,
    correctVarValueBeforeDeclaration: false,
    moduleSideEffects: () => false,
    propertyReadSideEffects: false,
    tryCatchDeoptimization: false,
    unknownGlobalSideEffects: false
  }
};
function getCommandOptions(rawCommandOptions) {
  const external = rawCommandOptions.external ?? [];
  const globals = rawCommandOptions.globals?.reduce((aggregatedGlobals, globalDefinition) => {
    const [id, variableName] = globalDefinition.split(":");
    aggregatedGlobals[id] = variableName;
    if (external.indexOf(id) === -1) {
      external.push(id);
    }
    return aggregatedGlobals;
  }, {});
  return __spreadProps(__spreadValues({}, rawCommandOptions), {
    external,
    globals
  });
}
function mergeInputOptions(config, overrides, defaultOnWarnHandler) {
  const getOption = (name) => overrides[name] ?? config[name];
  const inputOptions = {
    acorn: getOption("acorn"),
    acornInjectPlugins: config.acornInjectPlugins,
    cache: config.cache,
    context: getOption("context"),
    experimentalCacheExpiry: getOption("experimentalCacheExpiry"),
    external: getExternal(config, overrides),
    inlineDynamicImports: getOption("inlineDynamicImports"),
    input: getOption("input") || [],
    makeAbsoluteExternalsRelative: getOption("makeAbsoluteExternalsRelative"),
    manualChunks: getOption("manualChunks"),
    maxParallelFileReads: getOption("maxParallelFileReads"),
    moduleContext: getOption("moduleContext"),
    onwarn: getOnWarn(config, defaultOnWarnHandler),
    perf: getOption("perf"),
    plugins: ensureArray(config.plugins),
    preserveEntrySignatures: getOption("preserveEntrySignatures"),
    preserveModules: getOption("preserveModules"),
    preserveSymlinks: getOption("preserveSymlinks"),
    shimMissingExports: getOption("shimMissingExports"),
    strictDeprecations: getOption("strictDeprecations"),
    treeshake: getObjectOption(config, overrides, "treeshake", objectifyOptionWithPresets(treeshakePresets, "treeshake", "false, true, ")),
    watch: getWatch(config, overrides, "watch"),
    denoResolver: getObjectOption(config, overrides, "denoResolver")
  };
  warnUnknownOptions(config, Object.keys(inputOptions), "input options", inputOptions.onwarn, /^output$/);
  return inputOptions;
}
var getExternal = (config, overrides) => {
  const configExternal = config.external;
  return typeof configExternal === "function" ? (source, importer, isResolved) => configExternal(source, importer, isResolved) || overrides.external.indexOf(source) !== -1 : ensureArray(configExternal).concat(overrides.external);
};
var getOnWarn = (config, defaultOnWarnHandler) => config.onwarn ? (warning) => config.onwarn(warning, defaultOnWarnHandler) : defaultOnWarnHandler;
var getObjectOption = (config, overrides, name, objectifyValue = (value) => typeof value === "object" ? value : {}) => {
  const commandOption = normalizeObjectOptionValue(overrides[name], objectifyValue);
  const configOption = normalizeObjectOptionValue(config[name], objectifyValue);
  if (commandOption !== void 0) {
    return commandOption && __spreadValues(__spreadValues({}, configOption), commandOption);
  }
  return configOption;
};
var getWatch = (config, overrides, name) => config.watch !== false && getObjectOption(config, overrides, name);
var normalizeObjectOptionValue = (optionValue, objectifyValue) => {
  if (!optionValue) {
    return optionValue;
  }
  if (Array.isArray(optionValue)) {
    return optionValue.reduce((result, value) => value && result && __spreadValues(__spreadValues({}, result), value), {});
  }
  return objectifyValue(optionValue);
};
var generatedCodePresets = {
  es2015: {
    arrowFunctions: true,
    constBindings: true,
    objectShorthand: true,
    reservedNamesAsProps: true
  },
  es5: {
    arrowFunctions: false,
    constBindings: false,
    objectShorthand: false,
    reservedNamesAsProps: true
  }
};
function mergeOutputOptions(config, overrides, warn) {
  const getOption = (name) => overrides[name] ?? config[name];
  const outputOptions = {
    amd: getObjectOption(config, overrides, "amd"),
    assetFileNames: getOption("assetFileNames"),
    banner: getOption("banner"),
    chunkFileNames: getOption("chunkFileNames"),
    compact: getOption("compact"),
    dir: getOption("dir"),
    dynamicImportFunction: getOption("dynamicImportFunction"),
    entryFileNames: getOption("entryFileNames"),
    esModule: getOption("esModule"),
    exports: getOption("exports"),
    extend: getOption("extend"),
    externalLiveBindings: getOption("externalLiveBindings"),
    file: getOption("file"),
    footer: getOption("footer"),
    format: getOption("format"),
    freeze: getOption("freeze"),
    generatedCode: getObjectOption(config, overrides, "generatedCode", objectifyOptionWithPresets(generatedCodePresets, "output.generatedCode", "")),
    globals: getOption("globals"),
    hoistTransitiveImports: getOption("hoistTransitiveImports"),
    indent: getOption("indent"),
    inlineDynamicImports: getOption("inlineDynamicImports"),
    interop: getOption("interop"),
    intro: getOption("intro"),
    manualChunks: getOption("manualChunks"),
    minifyInternalExports: getOption("minifyInternalExports"),
    name: getOption("name"),
    namespaceToStringTag: getOption("namespaceToStringTag"),
    noConflict: getOption("noConflict"),
    outro: getOption("outro"),
    paths: getOption("paths"),
    plugins: ensureArray(config.plugins),
    preferConst: getOption("preferConst"),
    preserveModules: getOption("preserveModules"),
    preserveModulesRoot: getOption("preserveModulesRoot"),
    sanitizeFileName: getOption("sanitizeFileName"),
    sourcemap: getOption("sourcemap"),
    sourcemapExcludeSources: getOption("sourcemapExcludeSources"),
    sourcemapFile: getOption("sourcemapFile"),
    sourcemapPathTransform: getOption("sourcemapPathTransform"),
    strict: getOption("strict"),
    systemNullSetters: getOption("systemNullSetters"),
    validate: getOption("validate")
  };
  warnUnknownOptions(config, Object.keys(outputOptions), "output options", warn);
  return outputOptions;
}

// src/rollup/task.ts
var Task = class {
  constructor(watcher, config) {
    this.cache = { modules: [] };
    this.invalidated = true;
    this.watcher = watcher;
    this.closed = false;
    this.skipWrite = Boolean(config.watch && config.watch.skipWrite);
    this.options = mergeOptions(config);
    this.outputs = this.options.output;
    this.outputFiles = this.outputs.map(getDestination).filter(Boolean);
    const watchOptions = this.options.watch || {};
    this.filter = createFilter(watchOptions.include, watchOptions.exclude);
    this.fileWatcher = new FileWatcher(this);
  }
  close() {
    this.closed = true;
    this.fileWatcher.close();
  }
  invalidate({ path, kind }) {
    this.invalidated = true;
    this.watcher.invalidate({ path, kind });
  }
  async run() {
    if (!this.invalidated) {
      return;
    }
    this.invalidated = false;
    const options = __spreadProps(__spreadValues({}, this.options), {
      cache: this.cache
    });
    const start = Date.now();
    this.watcher.emitter.emit("event", {
      code: "BUNDLE_START",
      input: this.options.input,
      output: this.outputFiles
    });
    let result = null;
    try {
      result = await rollup2(options);
      this.cache = result.cache;
      if (this.closed) {
        return;
      }
      if (!this.skipWrite) {
        await Promise.all(this.outputs.map((output) => result.write(output)));
      }
      this.watcher.emitter.emit("event", {
        code: "BUNDLE_END",
        duration: Date.now() - start,
        input: this.options.input,
        output: this.outputFiles,
        result
      });
    } catch (error2) {
      if (!this.closed && error2.id) {
        this.cache.modules = this.cache.modules.filter((module) => module.id !== error2.id);
      }
      handleError(error2, true);
      this.watcher.emitter.emit("event", {
        code: "ERROR",
        error: error2,
        result
      });
    }
  }
};

// src/rollup/watcher.ts
var eventsRewrites = {
  create: {
    create: "warn",
    modify: "create",
    remove: null
  },
  remove: {
    create: "modify",
    remove: "warn",
    modify: "warn"
  },
  modify: {
    create: "warn",
    remove: "remove",
    modify: "modify"
  }
};
var Watcher = class {
  constructor(configs, emitter) {
    this.buildDelay = 50;
    this.buildTimeout = null;
    this.invalidatedIds = /* @__PURE__ */ new Map();
    this.rerun = false;
    this.clearScreen = true;
    this.emitter = emitter;
    emitter.close = this.close.bind(this);
    this.tasks = configs.map((config) => new Task(this, config));
    for (const config of configs) {
      if (config.watch && config.watch.clearScreen === false) {
        this.clearScreen = false;
      }
    }
    this.buildDelay = configs.reduce((buildDelay, { watch: watch2 }) => watch2 && typeof watch2.buildDelay === "number" ? Math.max(buildDelay, watch2.buildDelay) : buildDelay, this.buildDelay);
    this.running = true;
    setTimeout(() => this.run());
  }
  close() {
    if (this.buildTimeout) {
      clearTimeout(this.buildTimeout);
    }
    for (const task of this.tasks) {
      task.close();
    }
    this.emitter.emit("close");
    this.emitter.removeAllListeners();
  }
  invalidate(file) {
    if (file) {
      const prevEvent = this.invalidatedIds.get(file.path);
      const event = prevEvent ? eventsRewrites[prevEvent][file.kind] : file.kind;
      if (event === null) {
        this.invalidatedIds.delete(file.path);
      } else {
        this.invalidatedIds.set(file.path, event);
      }
    }
    if (this.running) {
      this.rerun = true;
      return;
    }
    if (this.buildTimeout) {
      clearTimeout(this.buildTimeout);
    }
    this.buildTimeout = setTimeout(() => {
      this.buildTimeout = null;
      for (const [id, event] of this.invalidatedIds.entries()) {
        this.emitter.emit("change", id, { event });
      }
      this.invalidatedIds.clear();
      this.emitter.emit("restart");
      this.run();
    }, this.buildDelay);
  }
  async run() {
    this.running = true;
    if (this.clearScreen) {
      console.clear();
    }
    this.emitter.emit("event", {
      code: "START"
    });
    for (const task of this.tasks) {
      await task.run();
    }
    this.running = false;
    this.emitter.emit("event", {
      code: "END"
    });
    if (this.rerun) {
      this.rerun = false;
      this.invalidate();
    }
  }
};

// src/rollup/watch.ts
var WatchEmitter = class extends EventEmitter {
  constructor() {
    super();
    this.setMaxListeners(Infinity);
  }
  close() {
  }
};
function watch(config) {
  const emitter = new WatchEmitter();
  const configArray = ensureArray(config);
  const watchConfigs = configArray.filter((config2) => config2.watch !== false);
  if (!watchConfigs.length) {
    throw handleError({
      message: `Invalid value for option "watch" - there must be at least one config where "watch" is not set to "false".`
    });
  }
  new Watcher(watchConfigs, emitter);
  return emitter;
}

// version.ts
var coreRollupVersion = VERSION;
var denoRollupVersion = "0.20.0";
var version = `${coreRollupVersion}+${denoRollupVersion}`;
export {
  VERSION,
  coreRollupVersion,
  denoResolver,
  denoRollupVersion,
  rollup2 as rollup,
  version,
  watch
};
