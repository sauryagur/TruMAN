#!/bin/bash

# TruMAN Demo Runner Script

# Check for command argument
if [[ "$1" == "--help" || "$1" == "-h" ]]; then
  echo "TruMAN Demo Runner"
  echo ""
  echo "Usage: ./run_demo.sh [OPTION]"
  echo ""
  echo "Options:"
  echo "  -b, --backend   Run multiple backend instances (default)"
  echo "  -f, --ffi       Run the FFI integration test"
  echo "  -c, --clean     Clean up build artifacts before running"
  echo "  -h, --help      Display this help message"
  echo ""
  echo "Examples:"
  echo "  ./run_demo.sh -b     # Run backend demo"
  echo "  ./run_demo.sh -f     # Run FFI integration test"
  echo "  ./run_demo.sh -c -f  # Clean and run FFI test"
  exit 0
fi

# Default options
RUN_BACKEND=true
RUN_FFI=false
CLEAN=false

# Parse command line options
while [[ $# -gt 0 ]]; do
  case $1 in
    -b|--backend)
      RUN_BACKEND=true
      RUN_FFI=false
      shift
      ;;
    -f|--ffi)
      RUN_FFI=true
      RUN_BACKEND=false
      shift
      ;;
    -c|--clean)
      CLEAN=true
      shift
      ;;
    *)
      echo "Unknown option: $1"
      echo "Run ./run_demo.sh --help for usage"
      exit 1
      ;;
  esac
done

# Directory of this script
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" &> /dev/null && pwd)"
cd "$SCRIPT_DIR"

# Clean if requested
if [[ "$CLEAN" == "true" ]]; then
  echo "Cleaning build artifacts..."
  cargo clean
fi

# Fix FFI attributes if needed
if [[ -f fix_ffi.sh && ! -f backend/src/lib.rs.bak ]]; then
  echo "Fixing FFI attributes..."
  chmod +x fix_ffi.sh
  ./fix_ffi.sh
fi

# Build the project
echo "Building TruMAN..."
cargo build

# Run FFI test if requested
if [[ "$RUN_FFI" == "true" ]]; then
  echo "Running FFI integration test..."
  cargo run --bin ffi_test
  echo "FFI test completed."
  exit 0
fi

# Run backend demo if requested
if [[ "$RUN_BACKEND" == "true" ]]; then
  # Number of instances to run
  num_instances=2

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
fi

echo "Demo completed successfully."
