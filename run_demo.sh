#!/bin/bash

# Number of instances to run
num_instances=${1:-2}

# Build the backend_runner
echo "Building backend_runner..."
cd "$(dirname "$0")"
cargo build -p backend_runner

# Function to kill all processes on exit
cleanup() {
    echo "Cleaning up processes..."
    for pid in "${pids[@]}"; do
        if ps -p "$pid" > /dev/null; then
            kill "$pid" 2>/dev/null
        fi
    done
    exit 0
}

# Register cleanup function on script exit
trap cleanup EXIT INT TERM

# Array to store process IDs
declare -a pids

# Run multiple instances of the backend_runner
echo "Starting $num_instances instances of backend_runner..."
for i in $(seq 1 $num_instances); do
    # Create a named pipe for this instance
    pipe="/tmp/backend_runner_$i"
    rm -f "$pipe"
    mkfifo "$pipe"
    
    # Start the backend_runner with output to the pipe
    ./target/debug/backend_runner < "$pipe" > "backend_runner_$i.log" 2>&1 &
    pid=$!
    pids+=($pid)
    
    # Keep the pipe open
    exec 3>"$pipe"
    
    echo "Started instance $i with PID $pid"
    
    # Wait a bit before starting the next instance to avoid port conflicts
    sleep 2
done

echo "All instances started. Logs are being written to backend_runner_N.log files."
echo "Press Ctrl+C to stop all instances."

# Keep the script running
while true; do
    sleep 1
done
