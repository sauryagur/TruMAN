use crate::gossip::MyBehaviourEvent;

use super::GossipEvent;
use libp2p::{gossipsub::Message, swarm::SwarmEvent, Multiaddr, PeerId};

pub trait EventHandler {
    fn new_connections(&mut self, list: Vec<(PeerId, Multiaddr)>) -> Option<GossipEvent>;
    fn new_disconnections(&mut self, list: Vec<(PeerId, Multiaddr)>) -> Option<GossipEvent>;
    fn message(&mut self, peer_id: PeerId, message: Message) -> Option<GossipEvent>;
    fn handle(&mut self, event: SwarmEvent<MyBehaviourEvent>) -> Option<GossipEvent>;
}
