FROM node:12-alpine

WORKDIR /excalidraw-room

COPY package.json yarn.lock ./
RUN yarn

COPY tsconfig.json ./
COPY src ./src
RUN yarn build

EXPOSE 80
CMD ["yarn", "start"]
