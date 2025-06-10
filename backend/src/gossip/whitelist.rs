pub struct Whitelist {
  pub peers: Vec<libp2p::PeerId>,
}

impl Whitelist {
  pub fn new() -> Self {
    Self {
      peers: Vec::new(),
    }
  }
  pub fn add_peer(&mut self, peer_id: libp2p::PeerId) {
    if !self.peers.contains(&peer_id) {
      self.peers.push(peer_id);
    }
  }
  pub fn remove_peer(&mut self, peer_id: &libp2p::PeerId) {
    self.peers.retain(|p| p != peer_id);
  }
  pub fn contains(&self, peer_id: &libp2p::PeerId) -> bool {
    self.peers.contains(peer_id)
  }
}