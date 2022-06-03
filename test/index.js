import { createRoot } from "https://esm.sh/react-dom/client";
import React from "https://esm.sh/react";
import App from "./App.jsx";

const root = createRoot(document.querySelector("#root"));
root.render(React.createElement(App, { content: "Hello World!" }));
