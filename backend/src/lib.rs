mod gossip;
mod communication;

use gossip::{Gossip, room::GossipRooms, MyBehaviourEvent, GossipEvent};
use communication::{InteractionMessage};
use libp2p::swarm::SwarmEvent;
use std::sync::{Arc, Mutex};
use futures_util::stream::StreamExt; // Import the required traits
use tokio::{select, runtime::Runtime};

lazy_static::lazy_static! {
    static ref GOSSIP_INSTANCE: Arc<Mutex<Option<Gossip>>> = Arc::new(Mutex::new(None));
    static ref RUNTIME: Mutex<Option<Runtime>> = Mutex::new(None);
}

#[unsafe(no_mangle)]
pub extern "C" fn init() {
    let rt = match Runtime::new() {
        Ok(runtime) => runtime,
        Err(e) => {
            println!("Failed to create runtime: {}", e);
            return;
        }
    };
    *RUNTIME.lock().unwrap() = Some(rt);
}

#[unsafe(no_mangle)]
pub extern "C" fn init_gossip() {
    let gossip = Gossip::new().unwrap();
    *GOSSIP_INSTANCE.lock().unwrap() = Some(gossip);
}

#[unsafe(no_mangle)]
pub extern "C" fn start_gossip_loop() {
    let runtime_guard = RUNTIME.lock().unwrap();
    let Some(runtime) = runtime_guard.as_ref() else {
        println!("Runtime not initialized");
        return;
    };

    let handle = runtime.handle().clone();
    std::mem::drop(runtime_guard); // Lock releasing

    handle.spawn(async move {
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
pub extern "C" fn cleanup_runtime() {
    *RUNTIME.lock().unwrap() = None;
}

#[unsafe(no_mangle)]
pub extern "C" fn receive(line: &str) {
    let gossip = {
        let mut guard = GOSSIP_INSTANCE.lock().unwrap();
        guard.take()
    };
    let Some(mut gossip) = gossip else {
        println!("Gossip instance not initialized");
        return;
    };

    let data = parse_command(&mut gossip, line);
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
