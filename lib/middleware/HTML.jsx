import React from "https://esm.sh/react";

export default function HTML({
  title,
  stylesheets = [],
  scripts = [],
  entryContent = "",
  children,
}) {
  return (
    <html>
      <head>
        <meta charset="utf-8" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1.0, user-scalable=no, shrink-to-fit=no"
        />
        <title>{title}</title>
        {stylesheets.map((stylesheet) => (
          <link href={stylesheet} rel="stylesheet" />
        ))}
      </head>
      <body>
        <div id="root">{children}</div>
        {scripts.map((script) => (
          <script src={script} />
        ))}
        <script
          type="module"
          dangerouslySetInnerHTML={{ __html: entryContent }}
        />
      </body>
    </html>
  );
}
