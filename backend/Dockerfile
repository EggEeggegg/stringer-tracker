# ── Stage 1: Build ──────────────────────────────────────────────
FROM golang:1.24-alpine AS builder

WORKDIR /app

# Install gcc for CGO (sqlite driver needs it)
RUN apk add --no-cache gcc musl-dev

COPY go.mod go.sum ./
RUN go mod download

COPY . .
RUN CGO_ENABLED=1 GOOS=linux go build -o server ./cmd/server \
  && CGO_ENABLED=1 GOOS=linux go build -o migrate ./cmd/migrate

# ── Stage 2: Run ────────────────────────────────────────────────
FROM alpine:3.20

WORKDIR /app

RUN apk add --no-cache ca-certificates tzdata

COPY --from=builder /app/server .
COPY --from=builder /app/migrate .
COPY --from=builder /app/migrations ./migrations

EXPOSE 4000

CMD ["./server"]
