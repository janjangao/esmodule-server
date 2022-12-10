FROM denoland/deno:alpine
COPY scripts/esbuild.js esbuild.js
RUN deno bundle https://deno.land/x/esmoduleserver/mod.js bundle.js
RUN deno run --allow-read --allow-env --allow-net --allow-write --allow-run esbuild.js

FROM denoland/deno:alpine
MAINTAINER Jan Gao <hayond@qq.com>

WORKDIR /workspaces
COPY --from=0 bundle.min.js /esmoduleserver.js

EXPOSE 8000

ENTRYPOINT deno run --allow-read --allow-net --allow-write /esmoduleserver.js