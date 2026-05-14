FROM oven/bun:alpine

WORKDIR /app

# Install dependencies first for layer caching
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile --production

# Copy source code
COPY tsconfig.json .
COPY src ./src

# Default environment variables
ENV NODE_ENV=production

# Run the auth service
CMD ["bun", "run", "src/index.ts"]
