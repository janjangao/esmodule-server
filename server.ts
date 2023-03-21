import Application from "./Application.ts";

const app = new Application();

await app.listen({ port: 8000 });