mod gossip;
mod communication;

use gossip::{Gossip, room::GossipRooms, MyBehaviourEvent, GossipEvent};
use communication::{InteractionMessage};
use libp2p::swarm::SwarmEvent;
use std::sync::{Arc, Mutex};
use std::thread;
use futures::stream::StreamExt;

lazy_static::lazy_static! {
    static ref GOSSIP_INSTANCE: Arc<Mutex<Option<Gossip>>> = Arc::new(Mutex::new(None));
}

#[unsafe(no_mangle)]
pub extern "C" fn init() {
    let mut gossip = Gossip::new().unwrap();
    gossip.join_room("public_test").unwrap();
    gossip.open_ears().unwrap();
    *GOSSIP_INSTANCE.lock().unwrap() = Some(gossip);

    let gossip_clone = Arc::clone(&GOSSIP_INSTANCE);
    thread::spawn(move || {
        loop {
            let mut guard = gossip_clone.lock().unwrap();
            if let Some(ref mut gossip) = *guard {
                if let event = gossip.swarm.select_next_some() {
                    handle_event(&mut gossip, event);
                }
            }
        }
    });
}

#[unsafe(no_mangle)]
pub extern "C" fn receive(line: &str) {
    let mut guard = GOSSIP_INSTANCE.lock().unwrap();
    let Some(ref mut gossip) = *guard else {
        println!("Gossip instance not initialized");
        return;
    };

    let data = parse_command(gossip, line);
    let Some(data) = data else {
        return;
    };
    let room = gossip.get_topic_from_name(&data.1);
    let Some(room) = room else {
        println!("Invalid room given");
        return;
    };
    if let Err(e) = gossip.gossip(&data.0, room) {
        println!("Publish error: {e:?}");
    }
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
        InteractionMessage::Ping => println!("Ping received"),
        InteractionMessage::Other(e) => println!("Other message received: {:?}", e),
    }
}

fn parse_command(gossip: &mut Gossip, command: &str) -> Option<(InteractionMessage, String)> {
    let args: Vec<String> = command.split(" ").map(|s| s.to_string()).collect();
    if args.len() < 2 {
        println!("<cmd> <room> <info?>");
        return None;
    }
    let cmd = match args[0].as_str() {
        "ping" | "p" => InteractionMessage::Ping,
        "join_room" | "jr" => {
            println!("{:?}", gossip.join_room(&args[1]));
            return None;
        }
        _ => InteractionMessage::Other("fuck".to_string()),
    };
    Some((cmd, args[1].clone()))
}
