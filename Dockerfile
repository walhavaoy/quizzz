ARG BASE_IMAGE=node:22-alpine

FROM ${BASE_IMAGE} AS builder
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY tsconfig.json tsconfig.client.json ./
COPY src/ src/
COPY client/ client/
RUN npx tsc && npx tsc -p tsconfig.client.json

FROM ${BASE_IMAGE}
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev
COPY --from=builder /app/dist/ dist/
COPY public/ public/
COPY --from=builder /app/public/js/ public/js/
EXPOSE 8080
CMD ["node", "dist/server.js"]
