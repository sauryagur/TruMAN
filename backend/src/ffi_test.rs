use backend::*;
use backend::ffi::FFIList;
use std::thread;
use std::time::Duration;

fn print_ffi_list(list: FFIList, label: &str) {
    let strings = list.to_vec();
    println!("=== {} ===", label);
    if strings.is_empty() {
        println!("  (empty list)");
    } else {
        for (i, s) in strings.iter().enumerate() {
            println!("  [{}]: {}", i, s);
        }
    }
    println!("");
}

fn main() {
    println!("===== TruMAN Backend FFI Integration Test =====");
    
    // Test 1: Initialize the backend
    println!("\nTest 1: Initializing backend...");
    let whitelist = vec![];
    let whitelist_ffi = FFIList::from_vec(&whitelist).spread();
    let init_result = init(whitelist_ffi.0, whitelist_ffi.1, whitelist_ffi.2);
    println!("init() result: {}", if init_result == 1 { "SUCCESS" } else { "FAILURE" });
    
    // Test 2: Start gossip loop
    println!("\nTest 2: Starting gossip loop...");
    start_gossip_loop();
    println!("start_gossip_loop() called successfully");
    
    // Test 3: Get local peer ID
    println!("\nTest 3: Getting local peer ID...");
    let local_peer_id = get_local_peer_id();
    print_ffi_list(local_peer_id, "Local Peer ID");
    
    // Wait for peer discovery
    println!("Waiting for peer discovery (5 seconds)...");
    thread::sleep(Duration::from_secs(5));
    
    // Test 4: Get connected peers
    println!("\nTest 4: Getting connected peers...");
    let peers = get_peers();
    print_ffi_list(peers, "Connected Peers");
    
    // Test 5: Broadcast a message
    println!("\nTest 5: Broadcasting a message...");
    let message = "Hello from FFI test";
    let tag = "test";
    let message_bytes = message.as_bytes();
    let tag_bytes = tag.as_bytes();
    let broadcast_result = broadcast_message(
        message_bytes.as_ptr() as *mut u8,
        message_bytes.len(),
        tag_bytes.as_ptr(),
        tag_bytes.len()
    );
    println!("broadcast_message() result: {}", if broadcast_result == 1 { "SUCCESS" } else { "FAILURE" });
    
    // Test 6: Collect events
    println!("\nTest 6: Collecting events...");
    let events = collect_events();
    print_ffi_list(events, "Events");
    
    // Wait a bit more and check for events again (after broadcast)
    println!("Waiting for events (3 seconds)...");
    thread::sleep(Duration::from_secs(3));
    
    println!("\nTest 7: Collecting events again...");
    let events = collect_events();
    print_ffi_list(events, "Events");
    
    // Test 8: Cleanup
    println!("\nTest 8: Cleaning up...");
    cleanup();
    println!("cleanup() called successfully");
    
    println!("\nFFI Integration Test completed.");
}