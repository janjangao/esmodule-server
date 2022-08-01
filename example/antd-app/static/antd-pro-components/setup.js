export default async function setup(React, ReactDOM, moment) {
  if (React) self.React = React;
  if (ReactDOM) self.ReactDOM = ReactDOM;
  if (moment) self.moment = moment;
  const promises = [];
  if (!self.React) {
    promises.push(
      import("https://esm.sh/react").then(
        (reactModule) => (self.React = reactModule.default)
      )
    );
  }
  if (!self.ReactDOM) {
    promises.push(
      import("https://esm.sh/react-dom").then(
        (reactDomModule) => (self.ReactDOM = reactDomModule.default)
      )
    );
  }
  if (!self.moment) {
    promises.push(
      import("https://esm.sh/moment").then(
        (momentModule) => (self.moment = momentModule.default)
      )
    );
  }
  await Promise.all(promises);
  if (!self.ProComponents) {
    if (self.document) import("./components.css.js");
    await import("./antd.js");
    await import("./components.js");
  }
}
