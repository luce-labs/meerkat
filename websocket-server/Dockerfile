# Builder stage
FROM rustlang/rust:nightly-slim as builder

WORKDIR /usr/src/app

# Install required system dependencies
RUN apt-get update && \
    apt-get install -y pkg-config libssl-dev && \
    rm -rf /var/lib/apt/lists/*

# Copy the Cargo.toml and Cargo.lock files
COPY Cargo.toml ./

# Copy the source code
COPY src ./src
COPY migrations ./migrations

# Build the application in release mode
RUN cargo build --release

# Runtime stage
FROM debian:bookworm-slim

WORKDIR /app

# Install runtime dependencies
RUN apt-get update && \
    apt-get install -y libssl3 ca-certificates && \
    rm -rf /var/lib/apt/lists/*

# Copy the compiled binary from builder
COPY --from=builder /usr/src/app/target/release/websocket-server /app/websocket-server

# Copy migrations folder if needed for runtime
COPY --from=builder /usr/src/app/migrations ./migrations

# Expose the WebSocket port
EXPOSE 8080

# set environment variables
ENV DATABASE_URL="sqlite://db.sqlite"
ENV ADDRESS="0.0.0.0:8080"

# CREATE db.sqlite
RUN touch db.sqlite

# Run the binary
CMD ["./websocket-server"]
