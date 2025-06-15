use backend::*;
use backend::ffi::FFIList;
use std::io::{self, BufRead};
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::Arc;
use std::thread;
use std::time::Duration;

fn print_events(events: FFIList) {
    let events_vec = events.to_vec();
    if events_vec.is_empty() {
        return;
    }
    
    println!("\n📬 NEW EVENTS ({}):", events_vec.len());
    for (i, event) in events_vec.iter().enumerate() {
        println!("  [{}] {}", i+1, event);
    }
    println!();
}

fn print_peers(peers: FFIList) {
    let peers_vec = peers.to_vec();
    if peers_vec.is_empty() {
        println!("😔 No peers connected yet");
        return;
    }
    
    println!("\n👥 CONNECTED PEERS ({}):", peers_vec.len());
    for (i, peer) in peers_vec.iter().enumerate() {
        println!("  [{}] {}", i+1, peer);
    }
    println!();
}

fn print_local_id(id_list: FFIList) {
    let id_vec = id_list.to_vec();
    if id_vec.is_empty() {
        println!("❌ Failed to get local peer ID");
        return;
    }
    
    println!("\n🆔 LOCAL PEER ID:");
    println!("  {}", id_vec[0]);
    println!();
}

fn main() {
    // Initialize with an empty whitelist
    let whitelist = vec![];
    let whitelist = FFIList::from_vec(&whitelist).spread();
    
    println!("🚀 Initializing P2P network...");
    let init_result = init(whitelist.0, whitelist.1, whitelist.2);
    
    if init_result == 0 {
        println!("❌ Failed to initialize P2P network");
        return;
    }
    
    println!("✅ P2P network initialized successfully");
    
    // Get and display local peer ID
    let local_id = get_local_peer_id();
    print_local_id(local_id);
    
    println!("🔄 Starting gossip event loop...");
    start_gossip_loop();
    
    println!("🔍 Waiting for peer discovery...");
    std::thread::sleep(std::time::Duration::from_secs(5));
    
    // Show initial peers
    let peers = get_peers();
    print_peers(peers);
    
    // Set up a flag to control the event polling loop
    let running = Arc::new(AtomicBool::new(true));
    let r = running.clone();
    
    // Start event polling thread
    let event_thread = thread::spawn(move || {
        while r.load(Ordering::SeqCst) {
            let events = collect_events();
            print_events(events);
            thread::sleep(Duration::from_secs(2));
        }
    });
    
    // Start peer polling thread
    let r = running.clone();
    let peer_thread = thread::spawn(move || {
        while r.load(Ordering::SeqCst) {
            let peers = get_peers();
            print_peers(peers);
            thread::sleep(Duration::from_secs(10));
        }
    });

    println!("\n📱 Demo Mode - Commands:");
    println!("  [1] Send broadcast message");
    println!("  [2] Ping a peer");
    println!("  [3] Promote a peer to wolf");
    println!("  [q] Quit");
    
    let stdin = io::stdin();
    for line in stdin.lock().lines() {
        match line.unwrap().trim() {
            "1" => {
                println!("Enter message content:");
                let content = stdin.lock().lines().next().unwrap().unwrap();
                
                println!("Enter message tag (e.g., 'emergency', 'info'):");
                let tag = stdin.lock().lines().next().unwrap().unwrap();
                
                let result = broadcast_message(
                    content.as_bytes().as_ptr() as *mut u8, 
                    content.len(), 
                    tag.as_bytes().as_ptr() as *const u8, 
                    tag.len()
                );
                
                if result == 1 {
                    println!("✅ Message broadcast successfully");
                } else {
                    println!("❌ Failed to broadcast message");
                }
            },
            "2" => {
                // Get peers first
                let peers = get_peers();
                let peers_vec = peers.to_vec();
                
                if peers_vec.is_empty() {
                    println!("❌ No peers available to ping");
                    continue;
                }
                
                println!("Select peer to ping (1-{}):", peers_vec.len());
                for (i, peer) in peers_vec.iter().enumerate() {
                    println!("  [{}] {}", i+1, peer);
                }
                
                let selection = stdin.lock().lines().next().unwrap().unwrap();
                let idx = selection.parse::<usize>().unwrap_or(0);
                
                if idx < 1 || idx > peers_vec.len() {
                    println!("❌ Invalid selection");
                    continue;
                }
                
                let peer_id = &peers_vec[idx-1];
                // Parse peer ID from string to bytes
                match libp2p::PeerId::from_str(peer_id) {
                    Ok(peer_id) => {
                        let peer_bytes = peer_id.to_bytes();
                        let result = ping(peer_bytes.as_ptr(), peer_bytes.len());
                        
                        if result == 1 {
                            println!("✅ Ping sent successfully");
                        } else {
                            println!("❌ Failed to send ping");
                        }
                    },
                    Err(_) => {
                        println!("❌ Invalid peer ID format");
                    }
                }
            },
            "3" => {
                // Get peers first
                let peers = get_peers();
                let peers_vec = peers.to_vec();
                
                if peers_vec.is_empty() {
                    println!("❌ No peers available to promote");
                    continue;
                }
                
                println!("Select peer to promote to wolf (1-{}):", peers_vec.len());
                for (i, peer) in peers_vec.iter().enumerate() {
                    println!("  [{}] {}", i+1, peer);
                }
                
                let selection = stdin.lock().lines().next().unwrap().unwrap();
                let idx = selection.parse::<usize>().unwrap_or(0);
                
                if idx < 1 || idx > peers_vec.len() {
                    println!("❌ Invalid selection");
                    continue;
                }
                
                let peer_id = &peers_vec[idx-1];
                // Parse peer ID from string to bytes
                match libp2p::PeerId::from_str(peer_id) {
                    Ok(peer_id) => {
                        let peer_bytes = peer_id.to_bytes();
                        let result = new_wolf(peer_bytes.as_ptr(), peer_bytes.len());
                        
                        if result == 1 {
                            println!("✅ Peer promoted to wolf successfully");
                        } else {
                            println!("❌ Failed to promote peer to wolf");
                        }
                    },
                    Err(_) => {
                        println!("❌ Invalid peer ID format");
                    }
                }
            },
            "q" => {
                println!("🛑 Exiting...");
                running.store(false, Ordering::SeqCst);
                break;
            },
            _ => {
                println!("❓ Unknown command");
            }
        }
    }
    
    // Wait for threads to finish
    event_thread.join().unwrap();
    peer_thread.join().unwrap();
    
    // Clean up
    cleanup();
    println!("👋 Goodbye!");
}
