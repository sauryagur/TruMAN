use crate::gossip::{Gossip, MyBehaviourEvent, GossipEvent, room::GossipRooms};
use crate::communication::{InteractionMessage};
use crate::{log, FAIL, SUCCESS};
use libp2p::PeerId;
use libp2p::{swarm::SwarmEvent};
use std::time::SystemTime;
use futures_util::stream::StreamExt; // Import the required traits
use tokio::sync::MutexGuard;
use futures::future::FutureExt;

pub fn gossip_init(guard: &mut MutexGuard<'_, Option<Gossip>>, whitelist: Vec<String>) -> i32 {
    let failable_gossip = Gossip::new(&whitelist);
    if let Err(e) = failable_gossip {
        log!("Error initializing gossip: {:?}", e);
        return FAIL;
    }
    let mut gossip = failable_gossip.unwrap();
    
    // Join general chat room
    if let Err(e) = gossip.join_room("general") {
        log!("Error joining general room: {:?}", e);
        return FAIL;
    }
    
    // Start listening for connections
    if let Err(e) = gossip.open_ears() {
        log!("Error opening ears: {:?}", e);
        return FAIL;
    }

    **guard = Some(gossip);
    SUCCESS
}

pub fn gossip_loop(gossip: &mut Gossip, events: &mut Vec<GossipEvent>) {
    let Some(event) = gossip.swarm.select_next_some().now_or_never() else {
        return;
    };
    
    match handle_event(gossip, events, event) {
        Ok(_) => {},
        Err(e) => log!("Error handling event: {:?}", e),
    }
}

fn handle_event(
    gossip: &mut Gossip,
    events: &mut Vec<GossipEvent>,
    event: SwarmEvent<MyBehaviourEvent>
) -> Result<(), Box<dyn std::error::Error>> {
    // Safely handle the event and convert it to our GossipEvent type
    let action = match gossip.handle_event(event) {
        Some(action) => action,
        None => return Ok(()),
    };
     
    // Debug output for all events
    log!("Handling event: {:?}", action);
    
    // Store only one copy of the event
    match &action {
        GossipEvent::NewConnection(peer_id) => {
            log!("New connection detected to peer(s): {:?}", peer_id);
            events.push(action.clone());
        },
        GossipEvent::Disconnection(peer_id) => {
            log!("Disconnection from peer(s): {:?}", peer_id);
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
            log!("Received ping request, sending reply");
            let time_diff = match SystemTime::now().duration_since(SystemTime::UNIX_EPOCH) {
                Ok(duration) => duration.as_millis() - x,
                Err(_) => {
                    log!("Error calculating time difference for ping reply");
                    0 // Default to 0 if we can't calculate
                }
            };
            
            // Send reply but handle errors
            if let Err(e) = data.reply_to_peer(gossip, &InteractionMessage::PingReply(time_diff)) {
                log!("Failed to send ping reply: {:?}", e);
            } else {
                log!("Ping reply sent successfully");
            }
        },
        InteractionMessage::PingReply(x) => {
            log!("Received ping reply: {}ms", x);
            // Don't need to push this again, it was already added above
            // events.push(GossipEvent::Message((data.clone(), InteractionMessage::PingReply(x)))),
        }, 
        InteractionMessage::Name => {
            log!("Received name request, sending reply");
            if let Err(e) = data.reply_to_peer(gossip, &InteractionMessage::NameReply(gossip.peer_id().to_string())) {
                log!("Failed to send name reply: {:?}", e);
            } else {
                log!("Name reply sent successfully");
            }
        },
        InteractionMessage::NameReply(name) => {
            log!("Received name reply: {}", name);
            // Don't need to push this again, it was already added above
            // events.push(GossipEvent::Message((data.clone(), InteractionMessage::NameReply(name)))),
        },
        InteractionMessage::Message(message) => {
            log!("Received message: {}", message.message);
            // Don't need to push this again, it was already added above
            // events.push(GossipEvent::Message((data.clone(), InteractionMessage::Message(message)))),
        },
        InteractionMessage::NewWolf(new_wolf) => {
            log!("Received new wolf notification for: {}", new_wolf.new_wolf_peer_id);
            gossip.whitelist.add_peer(new_wolf.new_wolf_peer_id);
        },
        InteractionMessage::WolfVerify(_wolf_verify) => {
            log!("Received wolf verification for: {}", data.peer);
            gossip.whitelist.add_peer(data.peer);
        }
        InteractionMessage::Other => {
            log!("Received unknown message type, ignoring");
        },
    }    
    Ok(())
}

pub fn peer_id_from_raw_parts(
    peer_id: *const u8,
    peer_id_size: usize,
) -> Option<PeerId> {
    let peer_id_slice = unsafe {
        std::slice::from_raw_parts(peer_id, peer_id_size)
    };
    match libp2p::PeerId::from_bytes(peer_id_slice) {
        Ok(peer_id) => Some(peer_id),
        Err(_) => {
            log!("Invalid PeerId");
            return None;
        }
    }
}