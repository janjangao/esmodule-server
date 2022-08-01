FROM denoland/deno:alpine
MAINTAINER Jan Gao <hayond@qq.com>

WORKDIR /workspaces
COPY esm.sh esm.sh/
COPY lib lib/

EXPOSE 8000

ENTRYPOINT deno run --allow-read --allow-net --allow-write ./lib/server.js