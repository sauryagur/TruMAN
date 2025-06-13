mod gossip;
mod communication;
pub mod ffi;

use gossip::{Gossip, MyBehaviourEvent, GossipEvent, room::GossipRooms};
use communication::{InteractionMessage};
use libp2p::{swarm::SwarmEvent};
use std::sync::Arc;
use std::time::SystemTime;
use futures_util::stream::StreamExt; // Import the required traits
use tokio::{select, runtime::Runtime};
use tokio::sync::Mutex;
use once_cell::sync::Lazy;

use crate::ffi::FFIList;
use crate::{communication::NewWolf, gossip::GenerateRoomName};

lazy_static::lazy_static! {
    static ref GOSSIP_INSTANCE: Arc<Mutex<Option<Gossip>>> = Arc::new(Mutex::new(None));
    static ref EVENT_COLLECTION: Arc<Mutex<Option<Vec<GossipEvent>>>> = Arc::new(Mutex::new(Some(Vec::new())));
}
static RUNTIME: Lazy<Runtime> = Lazy::new(|| {
    Runtime::new().expect("Failed to create Tokio Lock runtime")
});

#[unsafe(no_mangle)]
pub extern "C" fn init(whitelist_ptr: *mut *mut u8, whitelist_sizes_ptr: *mut usize, whitelist_size: usize) {
    // We do have a bit of unsafe code, but that's because a list is not FFI-friendly.
    let whitelist = FFIList::init(
        whitelist_ptr,
        whitelist_sizes_ptr,
        whitelist_size
    ).to_vec();
    
    RUNTIME.block_on(async {
        let mut gossip = Gossip::new(&whitelist).unwrap();
        println!("Initialized with peer ID: {}", gossip.peer_id());

        gossip.join_room("general").unwrap(); // Yeah mate it's like discord here, general chat
        gossip.open_ears().unwrap();

        println!("Gossip instance initialized\nListening on {:?}", gossip.topics);
        *GOSSIP_INSTANCE.lock().await = Some(gossip);
    });

    // Use the `whitelist` as needed
}

#[unsafe(no_mangle)]
pub extern "C" fn start_gossip_loop() {
    RUNTIME.spawn(async {
        loop {
            let mut guard = GOSSIP_INSTANCE.lock().await;
            let Some(gossip) = guard.as_mut() else {
                println!("Gossip instance not initialized");
                return;
            };
            select! {
                event = gossip.swarm.select_next_some() => {
                    handle_event(gossip, event).await
                }
            }
            drop(guard);
            std::thread::sleep(std::time::Duration::from_secs(1));
        };
    });
}

#[unsafe(no_mangle)]
pub extern "C" fn collect_events() -> FFIList {
    RUNTIME.block_on(async {
        let mut events = EVENT_COLLECTION.lock().await;
        let Some(events) = events.as_mut() else {
            println!("Gossip instance not initialized");
            return FFIList::null();
        };
        let strings: Vec<String> = events
            .drain(..)
            .map(|event| {
                serde_json::to_string(&event).unwrap()
            })
            .collect();
        let output = FFIList::from_vec(&strings);
        std::mem::forget(strings);
        output
    })
}

#[unsafe(no_mangle)]
pub extern "C" fn ping(target: *const u8, target_size: usize) {
    let target_slice = unsafe {
        std::slice::from_raw_parts(target, target_size)
    };
    let target_peer_id = match libp2p::PeerId::from_bytes(target_slice) {
        Ok(peer_id) => peer_id,
        Err(_) => {
            println!("Invalid PeerId provided for ping");
            return;
        }
    };
    RUNTIME.block_on(async {
        let mut guard = GOSSIP_INSTANCE.lock().await;
        let Some(gossip) = guard.as_mut() else {
            println!("Gossip instance not initialized");
            return;
        };
        let room_name = target_peer_id.generate_room_name();
        if let Err(e) = gossip.join_room(&room_name) {
            println!("Error joining room: {e:?}");
            return;
        }
        let room_name = gossip.get_topic_from_name(&room_name);
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
        }
    })
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
        }
    })
}

pub extern "C" fn get_peers() -> FFIList {
    todo!()
}

pub extern "C" fn broadcast_message() {
    todo!()
}

#[unsafe(no_mangle)]
pub extern "C" fn new_wolf(
    new_wolf_peer_id: *const u8,
    new_wolf_peer_id_size: usize,
) {
    RUNTIME.block_on(async {
        let mut guard = GOSSIP_INSTANCE.lock().await;
        let Some(gossip) = guard.as_mut() else {
            println!("Gossip instance not initialized");
            return;
        };
        let new_wolf_peer_id_slice = unsafe {
            std::slice::from_raw_parts(new_wolf_peer_id, new_wolf_peer_id_size)
        };
        let new_wolf_peer_id = match libp2p::PeerId::from_bytes(new_wolf_peer_id_slice) {
            Ok(peer_id) => peer_id,
            Err(_) => {
                println!("Invalid PeerId provided for new wolf");
                return;
            }
        };
        let message = InteractionMessage::NewWolf(NewWolf {
            new_wolf_peer_id: new_wolf_peer_id.clone()
        });
        let room_name = gossip.get_topic_from_name("general");
        let Some(room_name) = room_name else {
            println!("Error getting room name");
            return;
        };
        if let Err(e) = gossip.gossip(&message, room_name) {
            println!("Error sending ping: {e:?}");
        }
    })
}

pub async fn handle_event(gossip: &mut Gossip, event: SwarmEvent<MyBehaviourEvent>) {
    let Some(action) = gossip.handle_event(event) else {
        return;
    };
    let mut guard = EVENT_COLLECTION.lock().await;
    let Some(events) = guard.as_mut() else {
        println!("Gossip instance not initialized");
        return;
    };
    events.push(action.clone());
    match action.clone() {
        GossipEvent::NewConnection(peer_id) => events.push(GossipEvent::NewConnection(peer_id)),
        GossipEvent::Disconnection(peer_id) => events.push(GossipEvent::Disconnection(peer_id)),
        _ => {}
    }
    let GossipEvent::Message((data, message)) = action else {
        println!("Event: {action:?}");
        return;
    };
    match message {
        InteractionMessage::Ping(x) => {
            let time_diff = SystemTime::now()
                .duration_since(SystemTime::UNIX_EPOCH)
                .expect("Time went backwards")
                .as_millis() - x;
            data.reply_to_peer(gossip, &InteractionMessage::PingReply(time_diff))
        },
        InteractionMessage::PingReply(x) => events.push(GossipEvent::Message((data, InteractionMessage::PingReply(x)))), // You asked for ping, you get the reply
        InteractionMessage::Name => data.reply_to_peer(gossip, &InteractionMessage::NameReply(gossip.peer_id().to_string())), // this should be a name received from the frontend, but we don't care about the "name" for the MVP
        InteractionMessage::NameReply(name) => events.push(GossipEvent::Message((data, InteractionMessage::NameReply(name)))),
        InteractionMessage::Message(message) => events.push(GossipEvent::Message((data, InteractionMessage::Message(message)))), // send the frontend
        InteractionMessage::NewWolf(new_wolf) => {
            gossip.whitelist.add_peer(new_wolf.new_wolf_peer_id);
        },
        InteractionMessage::WolfVerify(_wolf_verify) => {
            todo!();
        }
        InteractionMessage::Other => {}, // ignore it
    }
}