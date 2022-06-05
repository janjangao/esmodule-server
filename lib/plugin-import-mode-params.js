const PARAMS_DEV = "dev";
const PARAMS_BUNDLE = "bundle";
const PARAMS_SYMBOL_PREFIX = "?";
const PARAMS_SYMBOL_APPEND = "&";
const LINK_PREFIX = "http";

function generateSearchParams(dev, bundle, inputSearchParamsString) {
  let searchParamsString = "";
  if (!inputSearchParamsString) {
    const params = [];
    if (dev) params.push(PARAMS_DEV);
    if (bundle) params.push(PARAMS_BUNDLE);
    if (params.length > 0)
      searchParamsString +=
        PARAMS_SYMBOL_PREFIX + params.join(PARAMS_SYMBOL_APPEND);
  } else {
    const searchParams = new URLSearchParams(inputSearchParamsString);
    if (dev !== undefined) searchParams.delete(PARAMS_DEV);
    if (bundle !== undefined) searchParams.delete(PARAMS_DEV);
    const params = [];
    if (dev) params.push(PARAMS_DEV);
    if (bundle) params.push(PARAMS_BUNDLE);
    searchParamsString +=
      PARAMS_SYMBOL_PREFIX +
      searchParams +
      PARAMS_SYMBOL_APPEND +
      params.join(PARAMS_SYMBOL_APPEND);
  }
  return searchParamsString;
}

export default function PluginImportModeParam({ types: t }) {
  return {
    visitor: {
      ImportDeclaration(path, state) {
        const { dev, bundle, onlyLink, linkPrefix = LINK_PREFIX } = state.opts;
        const importSource = path.node.source.value;
        if (onlyLink && !importSource.startsWith(linkPrefix)) return;
        const questionIndex = importSource.indexOf("?");
        const searchParamsString =
          questionIndex === -1
            ? generateSearchParams(dev, bundle)
            : generateSearchParams(
                dev,
                bundle,
                importSource.substring(importSource.indexOf("?"))
              );
        path.node.source.value += searchParamsString;
      },
    },
  };
}
