import { MODE_PRODUCTION, getModeParam } from "./Util.js";

export function getRuntime(mode) {
    return mode === MODE_PRODUCTION
      ? `async function run(e,t,o){!t&&e.title&&(document.title=e.title);const a=e.default;if(a){const n=e.preload,r=e.stylesheets,c=n&&"function"==typeof n&&await n()||{},d=document.querySelector("#root");if(!t&&r){const e=document.querySelector("head");r.map(t=>e.insertAdjacentHTML("afterbegin",'<link href="'+t+'" rel="stylesheet">'))}const{createRoot:i,hydrateRoot:l}=c.ReactDOM||e.ReactDOM||await import("https://esm.sh/react-dom/client?bundle"),s={preloadedContext:c,preloadedState:o};if(t)l(d,a(s));else{i(d).render(a(s))}}}`
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