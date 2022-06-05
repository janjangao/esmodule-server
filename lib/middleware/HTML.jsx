import React from "https://esm.sh/react";

export default function HTML({ title, entryContent = "", children }) {
  return (
    <html>
      <head>
        <meta charset="utf-8" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1.0, user-scalable=no, shrink-to-fit=no"
        />
        <title>{title}</title>
      </head>
      <body>
        <div id="root">{children}</div>
        <script type="module" dangerouslySetInnerHTML={{__html: entryContent}} />
      </body>
    </html>
  );
}
