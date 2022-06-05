import React from "https://esm.sh/react";

function App({ content }) {
  return <div>{content}</div>;
}

export const title = "esmodule-server";

export default function main({ preloadedState }) {
  return React.createElement(App, { content: "Hello World!" });
}
