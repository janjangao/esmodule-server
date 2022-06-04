import React from "https://esm.sh/react";
import App from "./App.jsx";

export const title = "esmodule-server";

export const preloadedState = {};

export default function main({ preloadedState }) {
  return <App content="Hello World!" />;
}
