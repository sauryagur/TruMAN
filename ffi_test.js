#!/usr/bin/env node

/**
 * TruMAN FFI Integration Test
 * 
 * This script tests the FFI integration between the Node.js frontend and Rust backend.
 * It uses the ffi-napi module to call the Rust functions directly.
 * 
 * To use this test:
 * 1. Install dependencies: npm install ffi-napi ref-napi ref-array-napi
 * 2. Build the backend: cargo build
 * 3. Run this script: node ffi_test.js
 */

const ffi = require('ffi-napi');
const ref = require('ref-napi');
const ArrayType = require('ref-array-napi');
const Struct = require('ref-struct-napi');

// Define FFIList structure
const FFIList = Struct({
  ptr: ref.refType(ref.refType(ref.types.uint8)),
  sizes_ptr: ref.refType(ref.types.size_t),
  size: ref.types.size_t
});

// Create pointer types
const FFIListPtr = ref.refType(FFIList);
const StringArray = ArrayType(ref.refType(ref.types.uint8));
const SizeArray = ArrayType(ref.types.size_t);
const StringPtr = ref.refType(ref.types.uint8);

// Helper function to convert FFIList to JavaScript strings
function ffiListToStrings(ffiList) {
  const result = [];
  
  if (!ffiList || ffiList.size === 0) {
    return result;
  }
  
  try {
    // Get array of string pointers
    const ptrs = ref.reinterpret(ffiList.ptr, ffiList.size * ref.sizeof.pointer);
    const sizes = ref.reinterpret(ffiList.sizes_ptr, ffiList.size * ref.sizeof.size_t);
    
    // Convert each pointer to a string
    for (let i = 0; i < ffiList.size; i++) {
      const strPtr = ref.readPointer(ptrs, i * ref.sizeof.pointer);
      const strSize = ref.readSize_t(sizes, i * ref.sizeof.size_t);
      
      if (strSize > 0 && !ref.isNull(strPtr)) {
        const buf = ref.reinterpret(strPtr, strSize);
        result.push(buf.toString('utf8'));
      }
    }
  } catch (err) {
    console.error('Error parsing FFIList:', err);
  }
  
  return result;
}

// Load the Rust library
const libPath = __dirname + '/target/debug/libbackend.so';
console.log(`Loading library from: ${libPath}`);

try {
  const backend = ffi.Library(libPath, {
    'init': ['int', [ref.refType(StringPtr), ref.refType(ref.types.size_t), 'size_t']],
    'start_gossip_loop': ['void', []],
    'collect_events': [FFIList, []],
    'ping': ['int', [StringPtr, 'size_t']],
    'get_peers': [FFIList, []],
    'broadcast_message': ['int', [StringPtr, 'size_t', StringPtr, 'size_t']],
    'new_wolf': ['int', [StringPtr, 'size_t']],
    'get_local_peer_id': [FFIList, []],
    'cleanup': ['void', []]
  });

  console.log('===== TruMAN Node.js FFI Integration Test =====');

  // Test 1: Initialize
  console.log('\nTest 1: Initializing backend...');
  const emptyWhitelist = new StringArray(0);
  const emptySizes = new SizeArray(0);
  const initResult = backend.init(emptyWhitelist, emptySizes, 0);
  console.log(`init() result: ${initResult === 1 ? 'SUCCESS' : 'FAILURE'}`);

  if (initResult !== 1) {
    console.error('Initialization failed, aborting test');
    process.exit(1);
  }

  // Test 2: Start gossip loop
  console.log('\nTest 2: Starting gossip loop...');
  backend.start_gossip_loop();
  console.log('start_gossip_loop() called successfully');
  
  // Test 3: Get local peer ID
  console.log('\nTest 3: Getting local peer ID...');
  const localPeerIdList = backend.get_local_peer_id();
  const localPeerIds = ffiListToStrings(localPeerIdList);
  console.log('Local Peer ID:', localPeerIds[0] || '(null)');
  
  // Wait for peer discovery
  console.log('\nWaiting for peer discovery (5 seconds)...');
  
  setTimeout(() => {
    // Test 4: Get peers
    console.log('\nTest 4: Getting connected peers...');
    const peersList = backend.get_peers();
    const peers = ffiListToStrings(peersList);
    
    console.log('Connected Peers:');
    if (peers.length === 0) {
      console.log('  (no peers connected)');
    } else {
      peers.forEach((peer, i) => console.log(`  [${i}]: ${peer}`));
    }
    
    // Test 5: Broadcast message
    console.log('\nTest 5: Broadcasting a message...');
    const message = Buffer.from('Hello from Node.js FFI test');
    const tag = Buffer.from('test');
    const broadcastResult = backend.broadcast_message(message, message.length, tag, tag.length);
    console.log(`broadcast_message() result: ${broadcastResult === 1 ? 'SUCCESS' : 'FAILURE'}`);
    
    // Test 6: Collect events
    console.log('\nTest 6: Collecting events...');
    const eventsList = backend.collect_events();
    const events = ffiListToStrings(eventsList);
    
    console.log('Events:');
    if (events.length === 0) {
      console.log('  (no events)');
    } else {
      events.forEach((event, i) => console.log(`  [${i}]: ${event}`));
    }
    
    // Wait for events to be generated
    console.log('\nWaiting for events (3 seconds)...');
    
    setTimeout(() => {
      // Test 7: Collect events again
      console.log('\nTest 7: Collecting events again...');
      const eventsList2 = backend.collect_events();
      const events2 = ffiListToStrings(eventsList2);
      
      console.log('Events:');
      if (events2.length === 0) {
        console.log('  (no events)');
      } else {
        events2.forEach((event, i) => console.log(`  [${i}]: ${event}`));
      }
      
      // Test 8: Cleanup
      console.log('\nTest 8: Cleaning up...');
      backend.cleanup();
      console.log('cleanup() called successfully');
      
      console.log('\nFFI Integration Test completed successfully');
    }, 3000);
  }, 5000);
} catch (error) {
  console.error('Error during FFI integration test:', error);
}
