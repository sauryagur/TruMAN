# TruMAN

TruMAN (Trustworthy Mesh Alert Network) is a **secure, decentralized, peer-to-peer communication platform** designed for disaster scenarios where traditional infrastructure (internet, cell towers) is unavailable. It runs across mobile devices and local networks, using a mesh architecture of "wolf" and "sheep" nodes to ensure message propagation even in fragmented areas.

---

## 🔧 Features

- 📡 **Offline Mesh Communication** using Rust-based backend
- 🔐 **End-to-End Encryption** with shared secret key exchange
- ⚙️ **Role-Based Nodes**:
  - **Wolf nodes** relay messages across the mesh
  - **Sheep nodes** receive and forward messages selectively
- 📲 **Expo React Native Frontend** for mobile interaction
- 📁 **Shared Protobuf Schemas** for consistent cross-platform messaging
- 🐳 Docker setup for reproducible dev/test environments

---

## 📁 Project Structure

```
truman/
├── backend/         # Rust-based P2P networking backend
│   ├── src/
│   ├── Cargo.toml
│   └── ...
├── mobile/          # Expo-based React Native frontend
│   ├── App.js
│   ├── package.json
│   ├── components/
│   ├── screens/
│   └── ...
├── shared/          # (Optional) Protobuf schemas and shared types
│   └── protocol.proto
├── docker/          # Containerized build and dev setup
│   ├── docker-compose.yml
│   ├── backend.Dockerfile
│   └── mobile.Dockerfile
├── .gitignore
└── README.md
```

## 🔨 Prerequisites

- Rust
- Node.js + Expo CLI
- Docker (optional)
- Protobuf Compiler (protoc)

### 🧪 Running Locally

### 1. Clone the Repository
```bash
git clone --recurse-submodules https://github.com/your-org/truman.git
cd truman
```

### 2. Build the Rust Backend
```bash
cd backend
cargo build
cargo run
```

### 3. Run the Mobile App (Expo)
```bash
cd mobile
npm install
npx expo start
```

Make sure the backend is running to allow the app to establish P2P connections.

---

## 🐳 Docker Usage
```bash
docker-compose up --build
```

## Working Explanation

**Wolf Node**: An authorized node; all other nodes will take its words as the absolute truth

**Sheep Node**: A listener node, it forwards the message it receives.

### How do we know the message was from Wolf Node?
[Digital Signatures!](https://youtu.be/bBC-nXj3Ng4?t=227)

So the forwarded message will be along with a signature of proof. If a sheep node tries to spread rumors, then they would face the impossible task of breaking 2^256 bit encryption to show that the message was sent from a valid wolf.

### How does a new node learn about who is Wolf Node?
In the public room, the new node can request everyone to send their whitelists of wolf nodes. 
(The message will be tagged as `whitelist.request`, and the replies will be tagged as `whitelist.reply`.)

Some nodes might try to fake a wolf node in the whitelist, but they would need a majority to convince the new node.
