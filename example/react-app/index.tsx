import React from "https://esm.sh/react";

type Props = {
  content: string;
};

function App({ content }: Props) {
  return <div>{content}</div>;
}

export const title = "esmodule-server";

export default function main({
  preloadedState,
}: {
  preloadedState: Record<string, any>;
}) {
  return React.createElement(App, { content: "Hello World!" });
}
