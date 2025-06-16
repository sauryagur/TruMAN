#!/bin/bash

# A script to fix the FFI declarations in the TruMAN backend

cd "$(dirname "$0")"

# Create a backup of the original file
cp backend/src/lib.rs backend/src/lib.rs.bak

# Fix all instances of #[no_mangle] to #[unsafe(no_mangle)]
sed -i 's/#\[no_mangle\]/#\[unsafe(no_mangle)\]/g' backend/src/lib.rs

echo "Fixed FFI declarations in backend/src/lib.rs"
