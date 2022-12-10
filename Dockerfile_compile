FROM denoland/deno:alpine
MAINTAINER Jan Gao <hayond@qq.com>

WORKDIR /workspaces
COPY esm.sh /esmodule-server/esm.sh/
COPY lib /esmodule-server/lib/

EXPOSE 8000

ENTRYPOINT deno run --allow-read --allow-net --allow-write /esmodule-server/lib/server.js