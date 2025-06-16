# TruMAN Dockerized Development

This document explains how to build and run the TruMAN application using Docker.

## Prerequisites

- Docker and Docker Compose installed on your system
- Expo Go app installed on your mobile device

## Building and Running

1. Build and start the containers:

```bash
docker-compose up --build
```

2. Once the containers are running, you can scan the QR code with the Expo Go app to run the frontend on your device.

## Testing P2P Functionality

The P2P functionality of TruMAN uses the libp2p library for peer-to-peer networking. Docker is configured to use the host network to ensure proper connectivity between nodes.

To test multiple instances, you can:

1. Run the dockerized version on one machine
2. Run a separate instance directly (without Docker) on another machine
3. The nodes should discover each other automatically

## Notes on Network Configuration

- For proper P2P functionality, ensure ports are not blocked by firewalls
- The default P2P port is 37373, but nodes will also use random ports for connections
- For testing across different networks, you may need to configure port forwarding on your router

## Troubleshooting

If you encounter network connectivity issues:

1. Check that the host machine's firewall allows the necessary ports
2. Try running without Docker first to verify basic functionality
3. Use `docker logs` to check for any error messages in the backend services
