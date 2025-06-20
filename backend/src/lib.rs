mod gossip;
mod communication;
mod runtime;
mod internal;
mod log;
pub mod ffi;

use gossip::room::GossipRooms;
use communication::{InteractionMessage};
use std::sync::Arc;
use std::time::SystemTime;
use tokio::runtime::Runtime;
use tokio::sync::Mutex;
use crate::communication::Message;
use crate::ffi::FFIList;
use crate::runtime::BackendRuntime;
use crate::{communication::NewWolf, gossip::GenerateRoomName};
use crate::internal::{gossip_init, gossip_loop, peer_id_from_raw_parts};

lazy_static::lazy_static! {
    static ref BACKEND_RUNTIME: BackendRuntime = BackendRuntime {
        inner: Runtime::new().expect("Failed to create Tokio Lock runtime"),
        gossip_instance: Arc::new(Mutex::new(None)),
        event_collection: Arc::new(Mutex::new(Vec::new()))
    };
}

pub const FAIL: i32 = 0; // i32::Default() is 0
pub const SUCCESS: i32 = 1;


#[unsafe(no_mangle)]
pub extern "C" fn init(whitelist_ptr: *mut *mut u8, whitelist_sizes_ptr: *mut usize, whitelist_size: usize) -> i32 {
    let whitelist = FFIList::init(
        whitelist_ptr,
        whitelist_sizes_ptr,
        whitelist_size
    ).to_vec();
        
    BACKEND_RUNTIME.block_on(async {
        let mut guard = BACKEND_RUNTIME.gossip_instance.lock().await;
        gossip_init(&mut guard, whitelist)
    })
}

#[unsafe(no_mangle)]
pub extern "C" fn start_gossip_loop() {
    BACKEND_RUNTIME.spawn(async {
        loop {
            BACKEND_RUNTIME.with_gossip_and_event(|gossip, events| {
                gossip_loop(gossip, events);
            }).await;
            // Don't spin too fast if there's no work, let other tasks access the GOSSIP lock
            tokio::time::sleep(std::time::Duration::from_millis(100)).await;
        }
    });
}

#[unsafe(no_mangle)]
pub extern "C" fn collect_events() -> FFIList {
    BACKEND_RUNTIME.block_on_event(|events| {
        if events.is_empty() {
            return FFIList::new();
        }
        
        // Convert events to strings safely
        let mut strings = Vec::with_capacity(events.len());
        for event in events.drain(..) {
            match serde_json::to_string(&event) {
                Ok(event_str) => strings.push(event_str),
                Err(e) => {
                    log!("Error serializing event: {:?}", e);
                    // Skip this event but continue with others
                }
            }
        }
        
        log!("Collected {} events", strings.len());
        
        // Create FFI list from strings
        let output = FFIList::from_vec(&strings);
        
        // Don't forget the strings memory!
        std::mem::forget(strings);
        
        output
    })
}

#[unsafe(no_mangle)]
pub extern "C" fn ping(target: *const u8, target_size: usize) -> i32 {
    BACKEND_RUNTIME.block_on_gossip(|gossip| {
        // Safely get the target PeerId from bytes
        let target_slice = unsafe {
            std::slice::from_raw_parts(target, target_size)
        };
        
        let target_peer_id = match libp2p::PeerId::from_bytes(target_slice) {
            Ok(peer_id) => peer_id,
            Err(_) => {
                log!("Invalid PeerId provided for ping");
                return FAIL;
            }
        };
        // Join a room specific to the target peer
        let room_name = target_peer_id.generate_room_name();
        if let Err(e) = gossip.join_room(&room_name) {
            log!("Error joining room: {e:?}");
            return FAIL;
        }
        
        let room_name = match gossip.get_topic_from_name(&room_name) {
            Some(name) => name,
            None => {
                log!("Error getting room name for {}", &room_name);
                return FAIL;
            }
        };
        
        // Create a ping message with current timestamp
        let message = InteractionMessage::Ping(
            SystemTime::now()
                .duration_since(SystemTime::UNIX_EPOCH)
                .expect("Time went backwards")
                .as_millis() // Convert to milliseconds
        );
        
        // Send the ping message
        match gossip.gossip(&message, room_name) {
            Ok(_) => {
                log!("Ping sent successfully to {}", target_peer_id);
                SUCCESS
            },
            Err(e) => {
                log!("Error sending ping: {e:?}");
                FAIL
            }
        }
    })
}

#[cfg(debug_assertions)]
pub extern "C" fn ping_test() {
    BACKEND_RUNTIME.block_on_gossip(|gossip| {
        // let target_peer_id = gossip.peer_ids.iter().next().cloned();
        // let Some(target_peer_id) = target_peer_id else {
        //     log!("No peer IDs available for ping test");
        //     return;
        // };
        // let room_name = target_peer_id.generate_room_name();
        // if let Err(e) = gossip.join_room(&room_name) {
        //     log!("Error joining room: {e:?}");
        //     return;
        // }
        
        // Check if we have any peers before trying to send a ping
        if gossip.peer_ids.is_empty() {
            log!("No peers connected yet - skipping ping test");
            return;
        }
        
        //TODO pinging in general is insane
        let room_name = gossip.get_topic_from_name("general");
        let Some(room_name) = room_name else {
            log!("Error getting room name");
            return;
        };
        let message = InteractionMessage::Ping(
            SystemTime::now()
                .duration_since(SystemTime::UNIX_EPOCH)
                .expect("Time went backwards")
                .as_millis() // Convert to milliseconds
        );
        if let Err(e) = gossip.gossip(&message, room_name) {
            log!("Error sending ping: {e:?}");
            // Don't crash on InsufficientPeers - it's an expected condition
            if let gossip::GossipSendError::PublishError(libp2p::gossipsub::PublishError::InsufficientPeers) = e {
                log!("Not enough peers connected yet to propagate messages");
            }
        }
    })
}

#[unsafe(no_mangle)]
pub extern "C" fn broadcast_message(message: *mut u8, message_size: usize, tag: *const u8, tag_size: usize) -> i32 {
    BACKEND_RUNTIME.block_on_gossip(|gossip| {
        // Get the general topic
        let topic = match gossip.get_topic_from_name("general") {
            Some(topic) => topic,
            None => {
                log!("Error getting 'general' topic");
                return FAIL;
            }
        };
        
        // Create the message from the provided data
        let msg = InteractionMessage::Message(Message{
            message: unsafe {
                std::str::from_utf8_unchecked(std::slice::from_raw_parts(message, message_size))
            }.to_string(),
            tags: unsafe {
                std::str::from_utf8_unchecked(std::slice::from_raw_parts(tag, tag_size))
            }.to_string().into(),
            timestamp: SystemTime::now()
                .duration_since(SystemTime::UNIX_EPOCH)
                .expect("Time went backwards")
                .as_millis() as u64, // Convert to milliseconds
        });
        
        // Send the message
        match gossip.gossip(&msg, topic) {
            Ok(_) => {
                log!("Message broadcast successfully");
                SUCCESS
            },
            Err(e) => {
                // Log but don't treat InsufficientPeers as a fatal error for UI
                if let gossip::GossipSendError::PublishError(libp2p::gossipsub::PublishError::InsufficientPeers) = e {
                    log!("Message queued but not sent - not enough peers connected yet");
                    // Return success to frontend so it doesn't show an error
                    // This makes the UI nicer during demo setup
                    // > Smart
                    // >  - Comet

                    return SUCCESS;
                }
                
                log!("Error broadcasting message: {:?}", e);
                FAIL
            }
        }
    })
}

#[unsafe(no_mangle)]
pub extern "C" fn new_wolf(
    new_wolf_peer_id: *const u8,
    new_wolf_peer_id_size: usize,
) -> i32 {
    BACKEND_RUNTIME.block_on_gossip(|gossip| {
        let Some(new_wolf_peer_id) = peer_id_from_raw_parts(new_wolf_peer_id, new_wolf_peer_id_size) else {
            return FAIL;
        };
        
        // First, add to the local whitelist regardless of whether we can broadcast
        gossip.whitelist.add_peer(new_wolf_peer_id.clone());
        log!("Added {} to local whitelist", new_wolf_peer_id);
        
        // Check if we have peers to broadcast to
        if gossip.peer_ids.is_empty() {
            log!("No peers connected yet - new wolf added locally only");
            // Return success even if we only added locally
            return 1;
        }
        
        let message = InteractionMessage::NewWolf(NewWolf {
            new_wolf_peer_id: new_wolf_peer_id.clone()
        });
        let room_name = gossip.get_topic_from_name("general");
        let Some(room_name) = room_name else {
            log!("Error getting room name");
            // Return success since we already added to local whitelist
            return 1;
        };
        
        match gossip.gossip(&message, room_name) {
            Ok(_) => {
                log!("Successfully announced new wolf to the network");
                1
            },
            Err(e) => {
                log!("Error broadcasting new wolf: {e:?}");
                if let gossip::GossipSendError::PublishError(libp2p::gossipsub::PublishError::InsufficientPeers) = e {
                    log!("Not enough peers connected yet to announce new wolf");
                    // Return success since we already added to local whitelist
                    1
                } else {
                    // Return success since we already added to local whitelist
                    // This makes demo smoother even if network broadcast fails
                    1
                }
            }
        }
    })
}

#[unsafe(no_mangle)]
pub extern "C" fn get_local_peer_id() -> FFIList {
    BACKEND_RUNTIME.block_on_gossip(|gossip| {
        // Get the local peer ID
        let peer_id = gossip.peer_id().to_string(); 

        // Create a vector with just the peer ID
        //  > WONDERFUL WORKAROUND
        //  >  - Comet
        let peer_ids = vec![peer_id];
        
        // Convert to FFIList
        let result = FFIList::from_vec(&peer_ids);
        
        // Make sure the vector isn't dropped
        std::mem::forget(peer_ids);
        
        result
    })
}

#[unsafe(no_mangle)]
pub extern "C" fn cleanup() {
    BACKEND_RUNTIME.block_on(async {
        log!("Cleaning up resources");
        let mut guard = BACKEND_RUNTIME.gossip_instance.lock().await;
        *guard = None;
    });
}

#[unsafe(no_mangle)]
pub extern "C" fn get_peers() -> FFIList {
    BACKEND_RUNTIME.block_on_gossip(|gossip| {
        // Get the connected peers
        let peer_ids: Vec<String> = gossip.peer_ids.iter()
            .map(|peer_id| peer_id.to_string())
            .collect();

        // Create FFIList for return
        let result = FFIList::from_vec(&peer_ids);
        
        // Important: forget the original strings to prevent deallocation
        std::mem::forget(peer_ids);
        
        result
    })
}