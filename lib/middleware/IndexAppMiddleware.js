import { getIndexApp } from "./Util.js";

export function getHtml(moduleEntry, preloadedState = {}, isSSR = "false") {
  return `<!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no, shrink-to-fit=no">
    <title></title>
  </head>   
  <body>
    <div id="root"></div>
    <script type="module">
      import * as module from "${moduleEntry}";
      if (module.title) document.title = module.title;
      const main = module.default;
      if (main) {
        const hasSSR = ${isSSR};
        const rootElement = document.querySelector("#root");
        const { createRoot, hydrateRoot } = await import("https://esm.sh/react-dom/client");
        const props = { preloadedState: ${JSON.stringify(preloadedState)} };
        if (!hasSSR) {
          const root = createRoot(rootElement);
          root.render(main(props));
        } else {
          hydrateRoot(rootElement, main(props));
        }
      }
    </script>
  </body>
  </html>
`;
}

export default async (context, next) => {
  const indexApp = await getIndexApp(context.request.url.pathname);
  if (indexApp) {
    context.response.body = getHtml(indexApp.path);
  } else {
    await next();
  }
};
