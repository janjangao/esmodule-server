# esmodule-server

[esmodule-server](https://github.com/hayond/esmodule-server) is a simple, zero-configuration ES module supported HTTP server. It is powerful enough for visiting ES module directly through modern browser. Fully support Typescript and React syntax. Not only that, but also a react container.

## Features

- Based on [Deno](https://deno.land), keep same code style with it.
- Fully support Typescript.
- Fully support React syntax, can visit `jsx` or `tsx` by modern browser directly.
- A powerful react container, natively support CSR and SSR.
- Production and Dev mode support by parameters(`?dev`, `?production`).

## DEMO
![image](https://raw.githubusercontent.com/hayond/esmodule-server/main/demo.gif)

## Running

### Run with docker
DockerHub: [hayond/esmodule-server](https://hub.docker.com/r/hayond/esmodule-server)

```
# ~/Downloads/static is local static directory, 8888 is local port

docker run -p 8888:8000 -v ~/Downloads/static:/workspaces --restart unless-stopped -d --name esmodule-server hayond/esmodule-server
```

### Run with deno
DenoLand: [esmoduleserver](https://deno.land/x/esmoduleserver)
```
deno run --allow-read --allow-net --allow-write https://deno.land/x/esmoduleserver/mod.js
```
Write code in currenty directory, and visit `http://localhost:8000/` using modern browser.

### Unfortunately, no Node implementation 
Merge request welcome or another variation.

## Examples

### simple server

create `index.html` and `index.jsx`

```HTML
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta
      name="viewport"
      content="width=device-width, initial-scale=1.0, user-scalable=no, shrink-to-fit=no"
    />
    <title>index</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="./index.jsx"></script>
  </body>
</html>
```
```javascript
import React from "https://esm.sh/react";
import { createRoot } from "https://esm.sh/react-dom/client";

const root = createRoot(document.querySelector("#root"));
root.render(<div>{content}</div>, { content: "Hello World!" });
```

### react app
only need create `index.jsx`
```javascript
import React from "https://esm.sh/react";

function App({ content }) {
  return <div>{content}</div>;
}

export const title = "esmodule-server";

export default function main({ preloadedState }) {
  return React.createElement(App, { content: "Hello World!" });
}
```

### react ssr app
implement export function `getPreloadedState` can open SSR, function `getServerReady` is useful server check whether data is ready, maximum try three times when return false.
```javascript
import React from "https://esm.sh/react";

function App({ content }) {
  return <div>{content}</div>;
}

export const title = "esmodule-server";

const store = {
  content: "Hello World!",
  isLoaded: true,
};

export function getPreloadedState() {
  return { ...store };
}

export function getServerReady() {
  return store.isLoaded;
}

export default function main({ preloadedState = {} }) {
  Object.assign(store, preloadedState);
  return React.createElement(App, { content: store.content });
}
```

### production and dev mode
- `?dev` add dev parameter to all link dependences, check more details: [esm.sh](https://esm.sh/), for example `http://localhost:8000/example/react-ssr-app/index.html?dev`
- `?production` bundle all the local scripts and minify them, in the meantime, add bundle parameter to all link dependences, check more details: [esm.sh](https://esm.sh/).

## upcoming features
- set production mode as default by command line args.
- custom server port by command line args.
- CDN host support for production mode.
- modulepreload support.
- ROOT importmaps support.
