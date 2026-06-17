FROM oven/bun:alpine

WORKDIR /app

COPY package.json ./
RUN bun install --production

COPY src ./src

CMD ["bun", "run", "start"]
