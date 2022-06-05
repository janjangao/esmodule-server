import React from "https://esm.sh/react@18.1.0";
import App from "./src/App.jsx";

export const title = "esmodule-server";

export function getPreloadedState() {
  return {};
}

export function getServerReady() {
  return false;
}

export default function main({ preloadedState }) {
  return React.createElement(App, { content: "Hello World!" });
}
