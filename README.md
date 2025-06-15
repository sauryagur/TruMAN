# TruMAN

TruMAN (Trustless Mesh Area Network) is a **secure, decentralized, peer-to-peer communication platform** designed for disaster scenarios where traditional infrastructure (internet, cell towers) is unavailable. It runs across mobile devices and local networks, using a mesh architecture of "wolf" and "sheep" nodes to ensure message propagation even in fragmented areas.

---

## 🔧 Features

- 📡 **Offline Mesh Communication** using Rust-based backend
- 🔐 **End-to-End Encryption** with shared secret key exchange
- ⚙️ **Role-Based Nodes**:
  - **Wolf nodes** relay messages across the mesh
  - **Sheep nodes** receive and forward messages selectively
- 📲 **Expo React Native Frontend** for mobile interaction
- 🐳 **Docker** setup for reproducible dev/test environments

---

## 📁 Project Structure

```
TruMAN
├── backend/               # Rust backend implementing P2P mesh network
│   ├── src/               # Source code for the backend
│   ├── backend.h          # Original C header for FFI
│   └── backend_improved.h # New C header with robust FFI interface
├── backend_runner/        # CLI tool for testing backend independently
├── frontend/              # React Native frontend application
│   ├── screens/           # UI screens for the application
│   ├── components/        # Reusable UI components
│   └── services/          # Services including backend FFI integration
├── target/                # Build artifacts
└── run_demo.sh            # Script for running multiple backend instances
```

## 🧰 Tech Stack

### 📦 Backend
- **Language**: Rust
- **P2P Library**: libp2p
- **FFI**: C-compatible interface for frontend integration

### 📱 Frontend
- **Framework**: React Native (via [Expo](https://expo.dev/))
- **Navigation**: React Navigation
- **Styles**: TailwindCSS

## 🚀 Setting Up Development Environment

### Prerequisites

- Rust toolchain (rustc, cargo)
- Node.js and npm/yarn
- React Native development environment

### Building the Backend

1. Build the Rust backend and runner:

```bash
cd TruMAN
cargo build
```

2. Run the backend runner to test P2P functionality:

```bash
cargo run -p backend_runner
```

### Running the Frontend

1. Install JavaScript dependencies:

```bash
cd frontend
npm install
# or
yarn install
```

2. Start the Metro bundler:

```bash
npm start
# or
yarn start
```

3. Run on Android or iOS:

```bash
npm run android
# or
npm run ios
```

## 🧪 Demoing TruMAN Features

### Option 1: Frontend + Backend Integration

When the frontend is properly connected to the backend via FFI, you can demo all features directly through the UI:

1. **Network Initialization**: The app automatically connects to the P2P network on startup
2. **Message Broadcasting**: Use the Messages screen to send and receive messages
3. **Peer Discovery**: Check the Peers screen to see other peers in the network
4. **Wolf Promotion**: Admins can promote trusted peers to wolf status

### Option 2: Backend-Only Demo

If there are issues with the frontend integration, you can demo all backend features using the backend_runner:

1. Run multiple instances to simulate a network:

```bash
./run_demo.sh 3  # Starts 3 instances
```

2. Each instance provides an interactive menu:
   - Option 1: Send broadcast messages
   - Option 2: Ping peers
   - Option 3: Promote peers to wolf status

### Checking Logs

Each backend_runner instance generates a log file where you can see the P2P network in action:

```bash
tail -f backend_runner_1.log
```

## 🔌 FFI Interface

The frontend communicates with the Rust backend through a Foreign Function Interface (FFI). The interface is defined in `backend/backend_improved.h` and implemented in `backend/src/lib.rs`.

Key FFI functions:

- `init`: Initialize the P2P network
- `start_gossip_loop`: Start the background event processing loop
- `collect_events`: Get events (messages, connections) from the network
- `ping`: Ping a specific peer
- `get_peers`: Get a list of connected peers
- `broadcast_message`: Send a message to all peers
- `new_wolf`: Promote a peer to wolf status
- `get_local_peer_id`: Get the local peer ID
- `cleanup`: Clean up resources

## 🔍 Troubleshooting

### Backend Issues

- **Segmentation Faults**: If you encounter segmentation faults, try running `backend_runner` in isolation to debug
- **Peer Discovery**: Sometimes it takes a few minutes for peers to discover each other
- **Port Conflicts**: If you get address already in use errors, try running instances with delay between them

### Frontend Issues

- **Native Module Not Found**: Ensure the backend libraries are properly compiled and linked
- **Connection Issues**: Check the `services/backend.ts` file for proper FFI integration
