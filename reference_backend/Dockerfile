FROM rust:1.87

# Create app directory
WORKDIR /usr/src/app

# Copy source
COPY . .

# Build the project
RUN cargo build --release

# Run binary (replace `truman` with actual binary name)
CMD ["./target/release/truman"]
