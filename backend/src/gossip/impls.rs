use std::error::Error;

use libp2p::Multiaddr;
use libp2p::gossipsub::{Event, Message, TopicHash};
use libp2p::mdns::Event::{Discovered, Expired};
use libp2p::swarm::SwarmEvent;
use libp2p::{PeerId, gossipsub::IdentTopic};

use crate::communication::{GetDataViaMessageError, InteractionMessage};
use crate::log;

use super::events::EventHandler;
use super::message::MessageData;
// use super::nonce::Nonce;
use super::room::{GossipRooms, Room};
use super::{Gossip, GossipEvent, MyBehaviourEvent};

impl GossipRooms for Gossip {
    fn get_peer_from_room_name(&self, room_name: &str) -> Option<&PeerId> {
        self.peer_ids
            .iter()
            .find(|id| id.to_string().contains(&room_name))
    }
    fn get_topic_from_name(&self, topic_self: &str) -> Option<IdentTopic> {
        // First check if we already have this topic
        for (room_name, room) in self.topics.iter() {
            if room_name == topic_self {
                log!("Found existing topic for {}", topic_self);
                return Some(room.clone());
            }
        }
        
        // Safety check - don't allow empty topic names
        if topic_self.is_empty() {
            log!("Warning: Attempted to get topic with empty name");
            return None;
        }
        
        // For safety, we could create the topic here but that would be a side effect
        // in a getter method, so we'll just log and return None
        log!("Topic '{}' not found in known topics", topic_self);
        None
    }
    fn join_room(&mut self, topic_str: &str) -> Result<(), Box<dyn Error>> {
        if self.get_topic_from_name(topic_str).is_some() {
            return Ok(()); // Already joined
        }

        let topic = IdentTopic::new(topic_str);
        self.topics.push((topic_str.to_string(), topic.clone()));

        self.swarm.behaviour_mut().gossipsub.subscribe(&topic)?;
        Ok(())
    }
    fn leave_room(&mut self, topic_str: &str) -> Result<(), Box<dyn Error>> {
        let topic = IdentTopic::new(topic_str);
        self.topics.retain(|(t, _)| t != topic_str);
        let _ = self.swarm.behaviour_mut().gossipsub.unsubscribe(&topic);
        Ok(())
    }
    fn get_room_from_hash(&self, topic: TopicHash) -> Room {
        for t in &self.topics {
            if t.1.hash() == topic {
                return self.get_room_from_name(t.0.clone());
            }
        }
        
        // Instead of panicking, return a default room
        log!("Warning: Topic hash not found, using default room");
        Room::PublicRoom("general".to_string())
    }
    fn get_room_from_name(&self, topic: String) -> Room {
        if topic.starts_with("public_") {
            return Room::PublicRoom(topic);
        }
        Room::DirectMessage(topic)
    }
}

impl EventHandler for Gossip {
    fn new_connections(&mut self, list: Vec<(PeerId, Multiaddr)>) -> Option<GossipEvent> {
        if list.is_empty() {
            return None;
        }
        
        let mut peers = Vec::with_capacity(list.len());
        
        // Process each new peer connection
        for (peer_id, _multiaddr) in list {
            log!("Adding peer: {}", peer_id);
            
            // Avoid re-adding existing peers
            if self.peer_ids.contains(&peer_id) {
                log!("Peer already known: {}", peer_id);
                continue;
            }
            
            // Add to gossipsub
            self.swarm
                .behaviour_mut()
                .gossipsub
                .add_explicit_peer(&peer_id);
                
            // Store for our notification
            peers.push(peer_id.clone());
            
            // Add to our tracking set
            self.peer_ids.insert(peer_id);
        }
        
        if peers.is_empty() {
            return None;
        }
        
        return Some(GossipEvent::NewConnection(peers));
    }
    fn new_disconnections(&mut self, list: Vec<(PeerId, Multiaddr)>) -> Option<GossipEvent> {
        if list.is_empty() {
            return None;
        }
        
        let mut peers = Vec::with_capacity(list.len());
        
        // Process each disconnected peer
        for (peer_id, _multiaddr) in list {
            log!("Removing peer: {}", peer_id);
            
            // Remove from gossipsub
            self.swarm
                .behaviour_mut()
                .gossipsub
                .remove_explicit_peer(&peer_id);
            
            // Store for our notification
            peers.push(peer_id.clone());
            
            // Remove from our tracking set
            self.peer_ids.remove(&peer_id);
        }
        
        if peers.is_empty() {
            return None;
        }
        
        return Some(GossipEvent::Disconnection(peers));
    }
    fn message(&mut self, peer_id: PeerId, message: Message) -> Option<GossipEvent> {
        log!("Received message from peer {} on topic {}", peer_id, message.topic);
        
        // Safety check for unexpected messages
        if message.data.is_empty() {
            log!("Warning: Received empty message, ignoring");
            return None;
        }
        
        let is_public_room = message.topic.to_string() == "general";
        let is_message_by_the_dm_op = peer_id.to_string().contains(&message.topic.to_string());
        let is_message_in_self_dm = self
            .peer_id()
            .to_string()
            .contains(&message.topic.to_string());
        
        // Messages to ignore
        // Private Room: Other DM's, other's messages
        // Messages to allow
        // Public Rooms
        // Private Room: DM OP's messages
        // FTF: Valid
        // FFF: Invalid
        // T__: Valid
        if !is_public_room && !is_message_by_the_dm_op && !is_message_in_self_dm {
            // probably someone asking the OP something, we don't care
            return None;
        }
        let data = message.data;//Nonce::remove_nonce(&message.data);
        let content = String::from_utf8_lossy(&data);
        let msg_data = MessageData {
            peer: peer_id,
            message: content.to_string(),
            room: self.get_room_from_hash(message.topic),
        };
        match InteractionMessage::from_msg(&self.whitelist, &msg_data) {
            Ok(interaction) => Some(GossipEvent::Message((msg_data, interaction))),
            Err(e) => {
                if let GetDataViaMessageError::Unauthorized = e {
                    // This peer is doing shit they shouldn't be able to do via the UI, so they are manipulating the system
                    let _ = self.swarm.disconnect_peer_id(msg_data.peer);
                }
                None
            }
        }
    }
    fn handle(&mut self, event: SwarmEvent<MyBehaviourEvent>) -> Option<GossipEvent> {
        match event {
            SwarmEvent::Behaviour(MyBehaviourEvent::Mdns(Discovered(list))) => {
                self.new_connections(list)
            }
            SwarmEvent::Behaviour(MyBehaviourEvent::Mdns(Expired(list))) => {
                self.new_disconnections(list)
            }
            SwarmEvent::Behaviour(MyBehaviourEvent::Gossipsub(Event::Message {
                propagation_source: peer_id,
                message_id: _,
                message,
            })) => self.message(peer_id, message),
            SwarmEvent::NewListenAddr { address, .. } => {
                log!("Local node is listening on {address}");
                None
            }
            SwarmEvent::ExpiredListenAddr { address, .. } => {
                log!("Local node is now not listening on {address}");
                None
            }
            _ => None,
        }
    }
}
