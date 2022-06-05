import React from "https://esm.sh/react@18.1.0";
import Content from "./Content.tsx";
// import Content from "./Content.jsx";

export default function App({ content }) {
  return <Content text={content} />;
}
