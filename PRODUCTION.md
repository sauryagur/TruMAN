# TruMAN App Production Deployment Guide

This guide provides instructions for preparing and deploying the TruMAN application for production use.

## Frontend (React Native/Expo)

### Building for Production

1. Install dependencies:
```bash
cd frontend
npm install
```

2. Create a production build:
```bash
# For iOS
expo build:ios

# For Android
expo build:android
```

3. Configure the app to connect to the production backend:
- Update `frontend/services/backend.ts` to set `isNativePlatform = true` for production builds
- Implement proper FFI bindings to connect to the Rust backend

## Backend (Rust)

### Building for Production

1. Build optimized release versions:
```bash
cd backend
cargo build --release

cd ../backend_runner
cargo build --release
```

2. Set up proper logging with log rotation:
```bash
# Install syslog or journald configuration for the backend_runner service
```

## Deployment Options

### 1. Docker Deployment

Use the provided Docker setup:
```bash
docker-compose up -d
```

### 2. Standalone Deployment

1. Start the backend services:
```bash
./run_demo.sh -b
```

2. Deploy the frontend app to app stores or as a PWA.

## Performance Optimization

- Use React Native's production mode
- Implement proper error handling and retry mechanisms
- Optimize network requests and minimize polling
- Use proper caching strategies for peer information

## Security Considerations

- Implement proper authentication for wolf nodes
- Use secure communication channels
- Validate all user inputs
- Follow secure coding practices

## Monitoring and Maintenance

- Implement health checks
- Set up monitoring for backend services
- Create a backup and recovery strategy
- Establish an update procedure
