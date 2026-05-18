FROM node:20-alpine

WORKDIR /app

COPY package.json ./
RUN npm i

COPY tsconfig.json ./
COPY src ./src
COPY scripts ./scripts

RUN npm run build

EXPOSE 4000

CMD ["node", "dist/index.js"]
