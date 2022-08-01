import { MODE_PRODUCTION, getModeParam } from "./Util.js";

export function getRuntime(mode) {
    return mode === MODE_PRODUCTION
      ? 'async function run(t,e,o){!e&&t.title&&(document.title=t.title);const a=t.default;if(a){const r=t.preload,c=r&&"function"==typeof r&&await r()||{},d=document.querySelector("#root"),{createRoot:n,hydrateRoot:i}=c.ReactDOM||t.ReactDOM||await import("https://esm.sh/react-dom/client?bundle"),l={preloadedContext:c,preloadedState:o};if(e)i(d,a(l));else{n(d).render(a(l))}}}'
      : `async function run(module, hasSSR, preloadedState) {
      if (!hasSSR && module.title) document.title = module.title;  
      const main = module.default;
      if (main) {
        const preload = module.preload;
        const stylesheets = module.stylesheets;
        const preloadedContext = preload && typeof preload === "function" ? (await preload()) || {} : {};
        const rootElement = document.querySelector("#root");
        if (!hasSSR && stylesheets) {
          const head = document.querySelector("head");
          stylesheets.map((stylesheet) => (head.insertAdjacentHTML("afterbegin", '<link href="'+ stylesheet +'" rel="stylesheet">')));
        }
        const { createRoot, hydrateRoot } = preloadedContext.ReactDOM || module.ReactDOM || await import("https://esm.sh/react-dom/client${getModeParam(mode)}");
        const props = { preloadedContext, preloadedState };
        if (!hasSSR) {
          const root = createRoot(rootElement);
          root.render(main(props));
        } else {
          hydrateRoot(rootElement, main(props));
        }
      }
    }`;
  }

export function getEntryContent(
  moduleEntry,
  mode,
  hasSSR = "false",
  preloadedState = {}
) {
  const importStatement = `import * as module from "${moduleEntry}${getModeParam(mode)}";`;
  const runStatement = `run(module, ${hasSSR}, ${JSON.stringify(preloadedState)});`;
  return mode === MODE_PRODUCTION 
  ? `${importStatement}${getRuntime(mode)};${runStatement}`
  : `
    ${importStatement}
    ${getRuntime(mode)};
    ${runStatement}
  `
}  

export function getHtml(
  moduleEntry,
  mode,
  hasSSR = "false",
  preloadedState = {}
) {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no, shrink-to-fit=no">
  <title></title>
</head>   
<body>
  <div id="root"></div>
  <script type="module">${getEntryContent(moduleEntry, mode, hasSSR, preloadedState)}</script>
</body>
</html>`;
}