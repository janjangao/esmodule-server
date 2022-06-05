// deps.ts
import {
  dirname,
  fromFileUrl,
  join,
  normalize,
  relative
} from "https://deno.land/std@0.110.0/path/mod.ts";

// ../../src/ensureArray.ts
function ensureArray(items) {
  if (Array.isArray(items)) {
    return items.filter(Boolean);
  } else if (items) {
    return [items];
  }
  return [];
}

// ../../deps.ts
import {
  basename,
  dirname as dirname2,
  extname,
  fromFileUrl as fromFileUrl2,
  isAbsolute,
  join as join2,
  normalize as normalize2,
  relative as relative2,
  resolve,
  sep,
  toFileUrl
} from "https://deno.land/std@0.110.0/path/mod.ts";

// ../../src/rollup-plugin-deno-resolver/ensureUrl.ts
var RE_URL = /^(https?|file):\/\//;
var RE_PATH_MALFORMED_HTTP_URL = /^((https?):)(?:\\+|\/)/;
var RE_PATH_MALFORMED_FILE_URL = /^((file):)(?:\\+|\/)([A-Za-z]:)?/;
function ensureUrl(source) {
  if (RE_URL.test(source)) {
    return source;
  } else if (RE_PATH_MALFORMED_HTTP_URL.test(source)) {
    return source.replace(RE_PATH_MALFORMED_HTTP_URL, "$1//").replace(/\\/g, "/");
  } else if (RE_PATH_MALFORMED_FILE_URL.test(source)) {
    return source.replace(RE_PATH_MALFORMED_FILE_URL, "$1///$3").replace(/\\/g, "/");
  }
  return null;
}

// ../../src/rollup-plugin-deno-resolver/resolveId.ts
var RE_HTTP_URL = /^(https?):\/\//;
var RE_WIN_DEVICE = /^([A-Za-z]:)(\\+|\/)/;
function resolveId(source, importer) {
  const sourceUrl = ensureUrl(source);
  if (sourceUrl) {
    return sourceUrl;
  }
  source = normalize2(source);
  if (importer) {
    const importerUrl = ensureUrl(importer);
    if (importerUrl) {
      const devicelessSource = source.replace(RE_WIN_DEVICE, "$2");
      const url = new URL(devicelessSource, importerUrl);
      return RE_HTTP_URL.test(url.href) ? url.href : fromFileUrl2(url);
    }
    if (isAbsolute(source)) {
      return source;
    }
    return join2(dirname2(importer), source);
  }
  return source;
}

// mod.ts
var isBareImportSpecifier = (address) => {
  if (address.startsWith("/") || address.startsWith("./") || address.startsWith("../") || address.startsWith("http://") || address.startsWith("https://") || address.startsWith("file://")) {
    return false;
  }
  return true;
};
var validate = (importMap, options, baseUrl) => Object.keys(importMap.imports ?? {}).map((specifier) => {
  const address = importMap.imports[specifier];
  if (isBareImportSpecifier(address)) {
    throw new TypeError(`import specifier "${specifier}" can not be mapped to a bare import statement "${address}".`);
  }
  if (typeof options.external === "function") {
    if (options.external(specifier, void 0, false)) {
      throw new TypeError("import specifier must not be present in the Rollup external config");
    }
  }
  if (Array.isArray(options.external)) {
    if (options.external.includes(specifier)) {
      throw new TypeError("import specifier must not be present in the Rollup external config");
    }
  }
  return { specifier, address, baseUrl };
});
var readFile = async (path, options, baseUrl) => {
  const importMapPath = normalize(path);
  const importMapFile = await Deno.readTextFile(importMapPath);
  const importMap = JSON.parse(importMapFile);
  return validate(importMap, options, baseUrl ?? dirname(importMapPath));
};
function isUrlMatch({ source, importer, specifier, baseUrl }) {
  try {
    const pathname = new URL(source, importer).pathname;
    const specifierPathname = new URL(specifier, baseUrl).pathname;
    if (pathname === specifierPathname) {
      return true;
    }
  } catch (_) {
  }
  return false;
}
function rollupImportMapPlugin(rollupImportMapOptions) {
  const cache = /* @__PURE__ */ new Map();
  const cwd = Deno.cwd();
  const importMaps = ensureArray(rollupImportMapOptions.maps);
  function getAddress(source, importer) {
    let out = null;
    for (const [specifier, { address, baseUrl }] of cache.entries()) {
      let base = baseUrl;
      if (importer) {
        if (importer.startsWith("file://")) {
          base = relative(fromFileUrl(importer), baseUrl);
        } else {
          base = relative(importer, baseUrl);
        }
      }
      const resolvedAddress = resolveId(address, base);
      if (specifier === source) {
        return resolvedAddress;
      } else if (isUrlMatch({ source, importer, specifier, baseUrl })) {
        out = resolvedAddress;
      } else if (specifier.endsWith("/") && source.startsWith(specifier)) {
        const suffix = source.slice(specifier.length);
        out = join(resolvedAddress, suffix);
      }
    }
    return out;
  }
  return {
    name: "rollup-plugin-import-map",
    async buildStart(options) {
      const mappings = await Promise.all(importMaps.map((importMap) => {
        if (typeof importMap === "string") {
          return readFile(importMap, options, rollupImportMapOptions.baseUrl);
        }
        return validate(importMap, options, rollupImportMapOptions.baseUrl ?? cwd);
      }));
      mappings.forEach((map) => {
        map.forEach(({ specifier, address, baseUrl }) => {
          cache.set(specifier, { address, baseUrl });
        });
      });
    },
    async resolveId(source, importer) {
      const address = getAddress(source, importer);
      if (address) {
        return {
          id: await resolveId(address, importer),
          external: rollupImportMapOptions.external ?? false
        };
      }
      return null;
    }
  };
}
export {
  rollupImportMapPlugin
};
