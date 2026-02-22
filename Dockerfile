FROM node:20-alpine AS builder

WORKDIR /build

COPY package.json yarn.lock ./
RUN yarn --frozen-lockfile

COPY tsconfig.json ./
COPY src ./src
RUN yarn build

FROM node:20-alpine AS production

WORKDIR /excalidraw-room

RUN addgroup -g 1001 -S eroom && \
    adduser -S eroom -u 1001 && \
    apk add --no-cache curl

COPY package.json yarn.lock ./
RUN yarn --frozen-lockfile --prod && \
    yarn cache clean

COPY --from=builder /build/dist ./dist

RUN chown -R eroom:eroom /excalidraw-room
USER eroom

EXPOSE 80

HEALTHCHECK CMD wget --no-verbose --tries=1 --spider http://localhost:80 || exit 1

CMD ["yarn", "start"]
