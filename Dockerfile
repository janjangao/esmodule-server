FROM denoland/deno:alpine
RUN deno bundle https://deno.land/x/esmoduleserver/mod.js esmoduleserver.js

FROM denoland/deno:alpine
MAINTAINER Jan Gao <hayond@qq.com>

WORKDIR /workspaces
COPY --from=0 esmoduleserver.js /esmoduleserver.js

EXPOSE 8000

ENTRYPOINT deno run --allow-read --allow-net --allow-write /esmoduleserver.js