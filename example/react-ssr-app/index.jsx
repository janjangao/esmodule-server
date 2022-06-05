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
