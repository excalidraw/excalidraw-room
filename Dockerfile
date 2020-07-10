FROM node:14.5

RUN mkdir /excalidraw-room

COPY src /excalidraw-room/src
COPY package.json /excalidraw-room
COPY tsconfig.json /excalidraw-room

WORKDIR /excalidraw-room

RUN npm install -g typescript
RUN npm install --silent
RUN npm run build

CMD ["npm", "start"]
