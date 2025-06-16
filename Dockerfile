FROM rust:1.72-slim as rust-builder

# Install build dependencies
RUN apt-get update && apt-get install -y \
    build-essential \
    curl \
    pkg-config \
    libssl-dev \
    && rm -rf /var/lib/apt/lists/*

# Create a new workspace
WORKDIR /app

# Copy Rust codebase
COPY backend ./backend
COPY backend_runner ./backend_runner
COPY uniffi_test ./uniffi_test
COPY run_demo.sh ./run_demo.sh
COPY fix_ffi.sh ./fix_ffi.sh
RUN chmod +x ./run_demo.sh ./fix_ffi.sh

# Build the Rust components
RUN cd backend && cargo build --release
RUN cd backend_runner && cargo build --release

# Install Node.js
FROM node:18-slim

# Install Expo CLI
RUN npm install -g expo-cli

# Create app directory
WORKDIR /app

# Copy built Rust binaries and libraries
COPY --from=rust-builder /app/backend/target/release/libbackend.so /app/backend/target/release/
COPY --from=rust-builder /app/backend_runner/target/release/backend_runner /app/backend_runner/target/release/
COPY --from=rust-builder /app/run_demo.sh /app/
RUN chmod +x /app/run_demo.sh

# Copy frontend code and install dependencies
COPY frontend /app/frontend
WORKDIR /app/frontend
RUN npm install

# Modify backend.ts to use actual Rust backend instead of mock
# This would need to be implemented with proper FFI bindings

# Expose ports for Expo and backend
EXPOSE 19000 19001 19002

# Create a script to start everything
WORKDIR /app
COPY docker-entrypoint.sh /app/
RUN chmod +x /app/docker-entrypoint.sh

ENTRYPOINT ["/app/docker-entrypoint.sh"]
