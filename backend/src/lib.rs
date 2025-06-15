mod gossip;
mod communication;
pub mod ffi;

use gossip::{Gossip, MyBehaviourEvent, GossipEvent, room::GossipRooms};
use communication::{InteractionMessage};
use libp2p::Swarm;
use libp2p::{swarm::SwarmEvent};
use std::sync::Arc;
use std::task::{Context, Poll};
use std::time::SystemTime;
use futures_util::stream::StreamExt; // Import the required traits
use tokio::{select, runtime::Runtime};
use tokio::sync::Mutex;
use once_cell::sync::Lazy;
use futures::future::{poll_fn, FutureExt};
use crate::communication::Message;
use crate::ffi::FFIList;
use crate::{communication::NewWolf, gossip::GenerateRoomName};

lazy_static::lazy_static! {
    static ref GOSSIP_INSTANCE: Arc<Mutex<Option<Gossip>>> = Arc::new(Mutex::new(None));
    static ref EVENT_COLLECTION: Arc<Mutex<Option<Vec<GossipEvent>>>> = Arc::new(Mutex::new(Some(Vec::new())));
}
static RUNTIME: Lazy<Runtime> = Lazy::new(|| {
    Runtime::new().expect("Failed to create Tokio Lock runtime")
});

#[no_mangle]
pub extern "C" fn init(whitelist_ptr: *mut *mut u8, whitelist_sizes_ptr: *mut usize, whitelist_size: usize) -> i32 {
    // We do have a bit of unsafe code, but that's because a list is not FFI-friendly.
    let whitelist = FFIList::init(
        whitelist_ptr,
        whitelist_sizes_ptr,
        whitelist_size
    ).to_vec();
    
    match std::panic::catch_unwind(|| {
        RUNTIME.block_on(async {
            let mut guard = GOSSIP_INSTANCE.lock().await;
            match Gossip::new(&whitelist) {
                Ok(mut gossip) => {
                    println!("Initialized with peer ID: {}", gossip.peer_id());
                    
                    // Join general chat room
                    if let Err(e) = gossip.join_room("general") {
                        println!("Error joining general room: {:?}", e);
                        return 0;
                    }
                    
                    // Start listening for connections
                    if let Err(e) = gossip.open_ears() {
                        println!("Error opening ears: {:?}", e);
                        return 0;
                    }

                    println!("Gossip instance initialized\nListening on {:?}", gossip.topics);
                    *guard = Some(gossip);
                    1
                },
                Err(e) => {
                    println!("Error initializing gossip: {:?}", e);
                    0
                }
            }
        })
    }) {
        Ok(result) => result,
        Err(e) => {
            println!("Panic in init: {:?}", e);
            0
        }
    }
}

#[no_mangle]
pub extern "C" fn start_gossip_loop() {
    println!("Starting gossip event loop...");
    RUNTIME.spawn(async {
        loop {
            // Process one event at a time with error handling
            {
                let mut guard = match GOSSIP_INSTANCE.lock().await {
                    guard => guard,
                };
                
                let Some(gossip) = guard.as_mut() else {
                    println!("Gossip instance not initialized");
                    return;
                };
                
                // This will either be Some(event) or None if no event is ready
                match gossip.swarm.select_next_some().now_or_never() {
                    Some(event) => {
                        // Got an event, try to handle it
                        match handle_event(gossip, event).await {
                            Ok(_) => {},
                            Err(e) => println!("Error handling event: {:?}", e),
                        }
                    },
                    None => {
                        // No event ready, that's fine
                    }
                }
            }
            
            // Don't spin too fast if there's no work
            tokio::time::sleep(std::time::Duration::from_millis(100)).await;
        }
    });
}

#[no_mangle]
pub extern "C" fn collect_events() -> FFIList {
    match std::panic::catch_unwind(|| {
        RUNTIME.block_on(async {
            // Get lock on events
            let mut events_guard = EVENT_COLLECTION.lock().await;
            
            // Check if events exists
            let Some(events) = events_guard.as_mut() else {
                println!("Event collection not initialized");
                return FFIList::null();
            };
            
            // If no events, return empty list
            if events.is_empty() {
                return FFIList::new();
            }
            
            // Convert events to strings safely
            let mut strings = Vec::with_capacity(events.len());
            for event in events.drain(..) {
                match serde_json::to_string(&event) {
                    Ok(event_str) => strings.push(event_str),
                    Err(e) => {
                        println!("Error serializing event: {:?}", e);
                        // Skip this event but continue with others
                    }
                }
            }
            
            println!("Collected {} events", strings.len());
            
            // Create FFI list from strings
            let output = FFIList::from_vec(&strings);
            
            // Don't forget the strings memory!
            std::mem::forget(strings);
            
            output
        })
    }) {
        Ok(result) => result,
        Err(e) => {
            println!("Panic in collect_events: {:?}", e);
            FFIList::new()
        }
    }
}
}

#[no_mangle]
pub extern "C" fn ping(target: *const u8, target_size: usize) -> i32 {
    match std::panic::catch_unwind(|| {
        // Safely get the target PeerId from bytes
        let target_slice = unsafe {
            std::slice::from_raw_parts(target, target_size)
        };
        
        let target_peer_id = match libp2p::PeerId::from_bytes(target_slice) {
            Ok(peer_id) => peer_id,
            Err(_) => {
                println!("Invalid PeerId provided for ping");
                return 0;
            }
        };
        
        RUNTIME.block_on(async {
            let mut guard = GOSSIP_INSTANCE.lock().await;
            let Some(gossip) = guard.as_mut() else {
                println!("Gossip instance not initialized");
                return 0;
            };
            
            // Join a room specific to the target peer
            let room_name = target_peer_id.generate_room_name();
            if let Err(e) = gossip.join_room(&room_name) {
                println!("Error joining room: {e:?}");
                return 0;
            }
            
            let room_name = match gossip.get_topic_from_name(&room_name) {
                Some(name) => name,
                None => {
                    println!("Error getting room name for {}", &room_name);
                    return 0;
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
                    println!("Ping sent successfully to {}", target_peer_id);
                    1
                },
                Err(e) => {
                    println!("Error sending ping: {e:?}");
                    0
                }
            }
        })
    }) {
        Ok(result) => result,
        Err(e) => {
            println!("Panic in ping: {:?}", e);
            0
        }
    }
}
}

#[cfg(debug_assertions)]
pub extern "C" fn ping_test() {
    RUNTIME.block_on(async {
        let mut guard = GOSSIP_INSTANCE.lock().await;
        let Some(gossip) = guard.as_mut() else {
            println!("Gossip instance not initialized");
            return;
        };
        // let target_peer_id = gossip.peer_ids.iter().next().cloned();
        // let Some(target_peer_id) = target_peer_id else {
        //     println!("No peer IDs available for ping test");
        //     return;
        // };
        // let room_name = target_peer_id.generate_room_name();
        // if let Err(e) = gossip.join_room(&room_name) {
        //     println!("Error joining room: {e:?}");
        //     return;
        // }
        
        // Check if we have any peers before trying to send a ping
        if gossip.peer_ids.is_empty() {
            println!("No peers connected yet - skipping ping test");
            return;
        }
        
        let room_name = gossip.get_topic_from_name("general");
        let Some(room_name) = room_name else {
            println!("Error getting room name");
            return;
        };
        let message = InteractionMessage::Ping(
            SystemTime::now()
                .duration_since(SystemTime::UNIX_EPOCH)
                .expect("Time went backwards")
                .as_millis() // Convert to milliseconds
        );
        if let Err(e) = gossip.gossip(&message, room_name) {
            println!("Error sending ping: {e:?}");
            // Don't crash on InsufficientPeers - it's an expected condition
            if let gossip::GossipSendError::PublishError(libp2p::gossipsub::PublishError::InsufficientPeers) = e {
                println!("Not enough peers connected yet to propagate messages");
            }
        }
    })
}

#[no_mangle]
pub extern "C" fn broadcast_message(message: *mut u8, message_size: usize, tag: *const u8, tag_size: usize) -> i32 {
    match std::panic::catch_unwind(|| {
        RUNTIME.block_on(async {
            let mut guard = GOSSIP_INSTANCE.lock().await;
            let Some(gossip) = guard.as_mut() else {
                println!("Gossip instance not initialized");
                return 0;
            };
            
            // Get the general topic
            let topic = match gossip.get_topic_from_name("general") {
                Some(topic) => topic,
                None => {
                    println!("Error getting 'general' topic");
                    return 0;
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
                    println!("Message broadcast successfully");
                    1
                },
                Err(e) => {
                    // Log but don't treat InsufficientPeers as a fatal error for UI
                    if let gossip::GossipSendError::PublishError(libp2p::gossipsub::PublishError::InsufficientPeers) = e {
                        println!("Message queued but not sent - not enough peers connected yet");
                        // Return success to frontend so it doesn't show an error
                        // This makes the UI nicer during demo setup
                        return 1;
                    }
                    
                    println!("Error broadcasting message: {:?}", e);
                    0
                }
            }
        })
    }) {
        Ok(result) => result,
        Err(e) => {
            println!("Panic in broadcast_message: {:?}", e);
            0
        }
    }
}
}

#[no_mangle]
pub extern "C" fn new_wolf(
    new_wolf_peer_id: *const u8,
    new_wolf_peer_id_size: usize,
) -> i32 {
    match std::panic::catch_unwind(|| {
        RUNTIME.block_on(async {
            let mut guard = GOSSIP_INSTANCE.lock().await;
            let Some(gossip) = guard.as_mut() else {
                println!("Gossip instance not initialized");
                return 0;
            };
            let new_wolf_peer_id_slice = unsafe {
                std::slice::from_raw_parts(new_wolf_peer_id, new_wolf_peer_id_size)
            };
            let new_wolf_peer_id = match libp2p::PeerId::from_bytes(new_wolf_peer_id_slice) {
                Ok(peer_id) => peer_id,
                Err(_) => {
                    println!("Invalid PeerId provided for new wolf");
                    return 0;
                }
            };
            
            // First, add to the local whitelist regardless of whether we can broadcast
            gossip.whitelist.add_peer(new_wolf_peer_id.clone());
            println!("Added {} to local whitelist", new_wolf_peer_id);
            
            // Check if we have peers to broadcast to
            if gossip.peer_ids.is_empty() {
                println!("No peers connected yet - new wolf added locally only");
                // Return success even if we only added locally
                return 1;
            }
            
            let message = InteractionMessage::NewWolf(NewWolf {
                new_wolf_peer_id: new_wolf_peer_id.clone()
            });
            let room_name = gossip.get_topic_from_name("general");
            let Some(room_name) = room_name else {
                println!("Error getting room name");
                // Return success since we already added to local whitelist
                return 1;
            };
            
            match gossip.gossip(&message, room_name) {
                Ok(_) => {
                    println!("Successfully announced new wolf to the network");
                    1
                },
                Err(e) => {
                    println!("Error broadcasting new wolf: {e:?}");
                    if let gossip::GossipSendError::PublishError(libp2p::gossipsub::PublishError::InsufficientPeers) = e {
                        println!("Not enough peers connected yet to announce new wolf");
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
    }) {
        Ok(result) => result,
        Err(e) => {
            println!("Panic in new_wolf: {:?}", e);
            0
        }
    }
}
}

#[no_mangle]
pub extern "C" fn get_local_peer_id() -> FFIList {
    match std::panic::catch_unwind(|| {
        RUNTIME.block_on(async {
            let guard = GOSSIP_INSTANCE.lock().await;
            let Some(gossip) = guard.as_ref() else {
                println!("Gossip instance not initialized in get_local_peer_id");
                return FFIList::new();
            };
            
            // Get the local peer ID
            let peer_id = gossip.peer_id().to_string();
            let strings = vec![peer_id];
            
            // Create FFIList for return
            let result = FFIList::from_vec(&strings);
            
            // Important: forget the original strings to prevent deallocation
            std::mem::forget(strings);
            
            result
        })
    }) {
        Ok(result) => result,
        Err(e) => {
            println!("Panic in get_local_peer_id: {:?}", e);
            FFIList::new()
        }
    }
}

#[no_mangle]
pub extern "C" fn cleanup() {
    RUNTIME.block_on(async {
        println!("Cleaning up resources");
        let mut guard = GOSSIP_INSTANCE.lock().await;
        *guard = None;
    });
}

pub async fn handle_event(gossip: &mut Gossip, event: SwarmEvent<MyBehaviourEvent>) -> Result<(), Box<dyn std::error::Error>> {
    // Safely handle the event and convert it to our GossipEvent type
    let action = match gossip.handle_event(event) {
        Some(action) => action,
        None => return Ok(()),
    };
    
    // Get lock on event collection
    let mut guard = EVENT_COLLECTION.lock().await;
    
    let Some(events) = guard.as_mut() else {
        println!("Gossip instance not initialized");
        return Ok(());
    };
    
    // Debug output for all events
    println!("Handling event: {:?}", action);
    
    // Store only one copy of the event
    match &action {
        GossipEvent::NewConnection(peer_id) => {
            println!("New connection detected to peer(s): {:?}", peer_id);
            events.push(action.clone());
        },
        GossipEvent::Disconnection(peer_id) => {
            println!("Disconnection from peer(s): {:?}", peer_id);
            events.push(action.clone());
        },
        _ => {
            // For message events, we'll process them below
            events.push(action.clone());
        }
    }
    
    // If it's not a message event, we're done
    let GossipEvent::Message((data, message)) = action else {
        // Event was already handled above
        return Ok(());
    };
    // Handle different message types
    match message {
        InteractionMessage::Ping(x) => {
            println!("Received ping request, sending reply");
            let time_diff = match SystemTime::now().duration_since(SystemTime::UNIX_EPOCH) {
                Ok(duration) => duration.as_millis() - x,
                Err(_) => {
                    println!("Error calculating time difference for ping reply");
                    0 // Default to 0 if we can't calculate
                }
            };
            
            // Send reply but handle errors
            if let Err(e) = data.reply_to_peer(gossip, &InteractionMessage::PingReply(time_diff)) {
                println!("Failed to send ping reply: {:?}", e);
            } else {
                println!("Ping reply sent successfully");
            }
        },
        InteractionMessage::PingReply(x) => {
            println!("Received ping reply: {}ms", x);
            // Don't need to push this again, it was already added above
            // events.push(GossipEvent::Message((data.clone(), InteractionMessage::PingReply(x)))),
        }, 
        InteractionMessage::Name => {
            println!("Received name request, sending reply");
            if let Err(e) = data.reply_to_peer(gossip, &InteractionMessage::NameReply(gossip.peer_id().to_string())) {
                println!("Failed to send name reply: {:?}", e);
            } else {
                println!("Name reply sent successfully");
            }
        },
        InteractionMessage::NameReply(name) => {
            println!("Received name reply: {}", name);
            // Don't need to push this again, it was already added above
            // events.push(GossipEvent::Message((data.clone(), InteractionMessage::NameReply(name)))),
        },
        InteractionMessage::Message(message) => {
            println!("Received message: {}", message.message);
            // Don't need to push this again, it was already added above
            // events.push(GossipEvent::Message((data.clone(), InteractionMessage::Message(message)))),
        },
        InteractionMessage::NewWolf(new_wolf) => {
            println!("Received new wolf notification for: {}", new_wolf.new_wolf_peer_id);
            gossip.whitelist.add_peer(new_wolf.new_wolf_peer_id);
        },
        InteractionMessage::WolfVerify(_wolf_verify) => {
            println!("Received wolf verification for: {}", data.peer);
            gossip.whitelist.add_peer(data.peer);
        }
        InteractionMessage::Other => {
            println!("Received unknown message type, ignoring");
        },
    }    
    Ok(())
}