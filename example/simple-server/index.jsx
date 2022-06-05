import React from "https://esm.sh/react";
import { createRoot } from "https://esm.sh/react-dom/client";

function App({ content }) {
    return <div>{content}</div>;
}

const root = createRoot(document.querySelector("#root"));
root.render(<App content={"Hello World!"} />);
