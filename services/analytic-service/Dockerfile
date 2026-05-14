# ===========================================
# Analytic Service - Multi-stage Alpine Build
# ===========================================

# --- Stage 1: Build ---
FROM golang:1.23-alpine AS builder

WORKDIR /app

# Install git for module downloads
RUN apk add --no-cache git

# Cache dependencies
COPY go.mod go.sum ./
RUN go mod download

# Copy source and build
COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -ldflags="-s -w" -o /analytic-service .

# --- Stage 2: Runtime ---
FROM alpine:3.21

RUN apk add --no-cache ca-certificates tzdata

WORKDIR /app

COPY --from=builder /analytic-service .

EXPOSE 3000

CMD ["./analytic-service"]
