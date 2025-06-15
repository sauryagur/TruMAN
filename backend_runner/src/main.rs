use backend::*;
use backend::ffi::FFIList;

fn print_events(events: FFIList) {
    println!("{:?}", events.to_vec());
}


fn main() {
    // Initialize with an empty whitelist
    let whitelist = vec![];
    let whitelist = FFIList::from_vec(&whitelist).spread();
    
    println!("Initializing P2P network...");
    init(whitelist.0, whitelist.1, whitelist.2);
    
    println!("Starting gossip event loop...");
    start_gossip_loop();
    
    // Wait a bit for mDNS discovery to find peers
    println!("Waiting for peer discovery...");
    std::thread::sleep(std::time::Duration::from_secs(5));
    
    println!("Starting passive listening mode - press Ctrl+C to exit");
    
    // Just stay running and let the gossip loop work
    // This avoids calling potentially problematic FFI functions
    loop {
        std::thread::sleep(std::time::Duration::from_secs(10));
    }
}
