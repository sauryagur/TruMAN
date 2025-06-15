# TruMAN - Trustless Mesh Area Network

TruMAN (Trustless Mesh Area Network) is a resilient peer-to-peer communication system built for emergency scenarios when traditional infrastructure is unavailable.

## Overview

TruMAN creates a decentralized mesh network that allows devices to communicate directly with each other without relying on central servers or traditional internet infrastructure. It uses a "wolf" and "sheep" node architecture to establish trust and distribute administrative capabilities across the network.

## Features

- **Resilient Mesh Networking**: Communication continues even if some nodes disconnect
- **Administrative "Wolf" Nodes**: Trusted nodes with enhanced capabilities
- **Standard "Sheep" Nodes**: Regular network participants
- **Direct Messaging**: Send messages to specific peers
- **Broadcasting**: Send messages to the entire network
- **Priority Messaging**: Emergency messages with different priority levels
- **Node Promotion**: Upgrade standard nodes to administrative status
- **Network Diagnostics**: Peer discovery, ping, and health checks

## Architecture

The system consists of two main components:

1. **Backend**: Built in Rust using libp2p for peer-to-peer networking
2. **Frontend**: Built with React Native for mobile devices

The architecture supports:
- Local peer discovery via mDNS
- Message propagation via GossipSub protocol
- End-to-end encrypted communications
- Trust establishment through wolf node whitelisting

## Running the Backend

### Prerequisites

- Rust and Cargo installed
- libp2p dependencies

### Build the Backend

```bash
cd TruMAN/backend
cargo build --release
```

### Run the Backend Demo Tool

```bash
cd TruMAN/backend_runner
cargo run
```

## Demoing Backend Features

To showcase all backend features, use the `backend_runner` tool in multiple terminal windows:

### Basic Setup

1. Open multiple terminal windows (at least 2-3)
2. In each window: `cd TruMAN/backend_runner && cargo run`
3. The first node automatically becomes a "wolf" node
4. Nodes will discover each other via mDNS (watch for "NewConnection" events)

### Available Commands

- `help` - Show all available commands
- `broadcast <message>` - Send message to all peers
- `dm <peer_id> <message>` - Send direct message to specific peer
- `promote <peer_id>` - Promote a sheep node to wolf status
- `status` - Display your node's status
- `peers` - List all connected peers
- `ping <peer_id>` - Check connectivity to a peer
- `health` - Show network health metrics
- `exit` - Terminate the node
- `broadcast_priority <1-3> <msg>` - Send priority-based message
- `whitelist` - Show current wolf whitelist

### Demo Scenarios

1. **Basic Messaging**:
   - Start multiple nodes
   - Use `broadcast` to send messages between them

2. **Wolf Node Administration**:
   - From a wolf node, use `promote <peer_id>` to grant another node wolf status
   - Observe how only wolf nodes can perform certain operations

3. **Network Resilience**:
   - Start several nodes
   - Terminate one node (Ctrl+C)
   - Continue sending messages to demonstrate the network still functions

## Running the Frontend

### Prerequisites

- Node.js and npm/yarn
- React Native development environment
- Expo CLI

### Install Dependencies

```bash
cd TruMAN/frontend
npm install
# or
yarn install
```

### Start the Frontend

```bash
npm start
# or
yarn start
```

Follow the Expo instructions to launch on a physical device or emulator.

## Troubleshooting

### Backend Issues

- **Peer Discovery Problems**: Ensure all instances are on the same network
- **Message Delivery Failures**: Wait 10-15 seconds after starting nodes before messaging
- **InsufficientPeers Errors**: This is normal when the network is still forming
- **Segmentation Faults**: Ensure you're using the latest version with fixed memory issues

### Frontend Issues

- **Connection to Backend Failed**: Check that the backend is running properly
- **Events Not Showing**: The event polling might have a delay; wait a few seconds

## Project Structure

```
TruMAN/
├── backend/              # Rust backend code
│   ├── src/             # Source files
│   │   ├── ffi.rs       # FFI interface
│   │   ├── gossip/      # P2P networking
│   │   └── lib.rs       # Main library code
│   └── backend.h        # C header for FFI functions
├── backend_runner/      # CLI demo tool
│   └── src/main.rs      # Runner implementation
└── frontend/            # React Native frontend
    ├── components/      # React components
    ├── screens/         # App screens
    ├── services/        # Backend connection services
    └── App.tsx          # Main application
```

## Development

### Building the Backend for Mobile

To build the backend for mobile platforms:

```bash
cd TruMAN/backend
cargo build --target aarch64-linux-android --release  # For Android arm64
cargo build --target armv7-linux-androideabi --release  # For Android arm
cargo build --target x86_64-apple-ios --release  # For iOS simulator
cargo build --target aarch64-apple-ios --release  # For iOS devices
```

### Testing the P2P Network

For quick testing of the P2P functionality:

```bash
cd TruMAN/backend_runner
# Terminal 1
cargo run

# Terminal 2
cargo run

# Observe peer discovery and messaging between instances
```

## License

[MIT License](LICENSE)

## Contributors

- [Your Name]
- [Other Contributors]