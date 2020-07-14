FROM node:14-alpine

WORKDIR /excalidraw-room

COPY package.json yarn.lock ./
COPY scripts ./scripts
RUN SKIP_YARN_POSTINSTALL=true yarn

COPY tsconfig.json ./
COPY src ./src
RUN yarn build

EXPOSE 80
CMD ["yarn", "start"]
