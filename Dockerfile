FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci --ignore-scripts
COPY tsconfig.json tsconfig.client.json ./
COPY src/ src/
COPY client/ client/
COPY public/ public/
RUN npm run build

FROM node:22-alpine
WORKDIR /app
COPY --from=build /app/dist/ dist/
COPY --from=build /app/public/ public/
COPY --from=build /app/node_modules/ node_modules/
COPY package.json ./
EXPOSE 8080
USER node
CMD ["node", "dist/server.js"]
