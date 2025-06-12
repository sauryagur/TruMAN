mod gossip;
mod communication;

use gossip::{Gossip, MyBehaviourEvent, GossipEvent};
use communication::{InteractionMessage};
use libp2p::swarm::SwarmEvent;
use std::sync::{Arc, Mutex};
use futures_util::stream::StreamExt; // Import the required traits
use tokio::{select, runtime::Runtime};
use once_cell::sync::Lazy;

use crate::gossip::room::GossipRooms;

lazy_static::lazy_static! {
    static ref GOSSIP_INSTANCE: Arc<Mutex<Option<Gossip>>> = Arc::new(Mutex::new(None));
}

static RUNTIME: Lazy<Runtime> = Lazy::new(|| {
    Runtime::new().expect("Failed to create Tokio runtime")
});

#[unsafe(no_mangle)]
pub extern "C" fn init(whitelist_ptr: *const *const u8, whitelist_sizes_ptr: *const usize, whitelist_size: usize) {
    let whitelist = unsafe {
        let whitelist_slices = std::slice::from_raw_parts(whitelist_ptr, whitelist_size);
        let whitelist_sizes = std::slice::from_raw_parts(whitelist_sizes_ptr, whitelist_size);
        whitelist_slices.iter().zip(whitelist_sizes.iter()).map(|(&ptr, &len)| {
            let slice = std::slice::from_raw_parts(ptr, len);
            String::from_utf8_lossy(slice).to_string()
        }).collect::<Vec<String>>()
    };

    RUNTIME.block_on(async {
        let mut gossip = Gossip::new(&whitelist).unwrap();
        println!("Initialized with peer ID: {}", gossip.peer_id());

        gossip.join_room("general").unwrap(); // Yeah mate it's like discord here, general chat
        gossip.open_ears().unwrap();

        *GOSSIP_INSTANCE.lock().unwrap() = Some(gossip);
    });

    // Use the `whitelist` as needed
}

#[unsafe(no_mangle)]
pub extern "C" fn start_gossip_loop() {
    // let runtime_guard = RUNTIME.lock().unwrap();
    // let Some(runtime) = runtime_guard.as_ref() else {
    //     println!("Runtime not initialized");
    //     return;
    // };

    // let handle = runtime.handle().clone();
    // std::mem::drop(runtime_guard); // Lock releasing

    RUNTIME.spawn(async move {
        let gossip = {
            let mut guard = GOSSIP_INSTANCE.lock().unwrap();
            guard.take()
        };
        let Some(mut gossip) = gossip else {
            println!("Gossip instance not initialized");
            return;
        };

        loop {
            select! {
                event = gossip.swarm.select_next_some() => handle_event(&mut gossip, event),
            }
        };
    });
}

#[unsafe(no_mangle)]
pub extern "C" fn receive(line: &char) {
    let _line = line.to_string();
    let gossip = {
        let mut guard = GOSSIP_INSTANCE.lock().unwrap();
        guard.take()
    };
    let Some(mut _gossip) = gossip else {
        println!("Gossip instance not initialized");
        return;
    };

    // let data = parse_command(&mut gossip, line);
    // let Some(data) = data else {
    //     return;
    // };
    // let room = gossip.get_topic_from_name(&data.1);
    // let Some(room) = room else {
    //     println!("Invalid room given");
    //     return;
    // };
    // if let Err(e) = gossip.gossip(&data.0, room) {
    //     println!("Publish error: {e:?}");
    // }
}

pub fn handle_event(gossip: &mut Gossip, event: SwarmEvent<MyBehaviourEvent>) {
    let Some(action) = gossip.handle_event(event) else {
        return;
    };
    let GossipEvent::Message((data, message)) = action else {
        println!("Event: {action:?}");
        return;
    };
    match message {
        InteractionMessage::Ping => data.reply_to_peer(gossip, &InteractionMessage::PingReply),
        InteractionMessage::PingReply => todo!(),
        InteractionMessage::Name => data.reply_to_peer(gossip, &InteractionMessage::NameReply(gossip.peer_id().to_string())), // this should be a name received from the frontend, but we don't care about the "name" for the MVP
        InteractionMessage::NameReply(_name) => todo!(),
        InteractionMessage::Message(_message) => todo!(), // send the frontend
        InteractionMessage::NewWolf(new_wolf) => {
            gossip.whitelist.add_peer(new_wolf.new_wolf_peer_id);
        },
        InteractionMessage::WolfVerify(_wolf_verify) => {
            todo!();
        }
        InteractionMessage::Other => {}, // ignore it
    }
}