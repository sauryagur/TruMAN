use serde::{Deserialize, Serialize};

use super::{
    GenerateRoomName, Gossip,
    room::{GossipRooms, Room},
};
use crate::communication::InteractionMessage;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct MessageData {
    pub peer: libp2p::PeerId,
    pub message: String,
    pub room: Room,
}

impl MessageData {
    pub fn reply_to_peer(&self, gossip: &mut Gossip, message: &InteractionMessage) -> Result<(), Box<dyn std::error::Error>> {
        // Check if we have the peer in our known peers
        if !gossip.peer_ids.contains(&self.peer) {
            println!("Warning: Trying to reply to unknown peer {}", self.peer);
            // Continue anyway as the peer might be known at a lower level
        }
        
        let room_name = self.peer.generate_room_name();
        gossip.join_room(&room_name)?;
        
        let room_name = match gossip.get_topic_from_name(&room_name) {
            Some(topic) => topic,
            None => return Err("Failed to get topic from room name".into()),
        };
        
        match gossip.gossip(message, room_name) {
            Ok(_) => Ok(()),
            Err(e) => {
                println!("Error sending message response: {:?}", e);
                
                // For InsufficientPeers, log but don't treat as fatal
                if let super::GossipSendError::PublishError(libp2p::gossipsub::PublishError::InsufficientPeers) = e {
                    println!("Not enough peers connected yet to send reply");
                    return Ok(());
                }
                
                Err(Box::new(e))
            }
        }
    }
    
    pub fn reply_to_room(&self, gossip: &mut Gossip, message: &InteractionMessage) -> Result<(), Box<dyn std::error::Error>> {
        let topic = match gossip.get_topic_from_name(&self.room.name()) {
            Some(topic) => topic,
            None => return Err("Failed to get topic from room name".into()),
        };
        
        match gossip.gossip(message, topic) {
            Ok(_) => Ok(()),
            Err(e) => {
                println!("Error sending message to room: {:?}", e);
                
                // For InsufficientPeers, log but don't treat as fatal
                if let super::GossipSendError::PublishError(libp2p::gossipsub::PublishError::InsufficientPeers) = e {
                    println!("Not enough peers connected yet to send to room");
                    return Ok(());
                }
                
                Err(Box::new(e))
            }
        }
    }
}
