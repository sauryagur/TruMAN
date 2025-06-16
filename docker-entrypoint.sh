#!/bin/bash

# Start the backend instances in the background
echo "Starting TruMAN backend instances..."
./run_demo.sh -b &

# Wait a bit for backend to initialize
sleep 5

# Start the Expo development server
echo "Starting Expo development server..."
cd /app/frontend
expo start --host all
