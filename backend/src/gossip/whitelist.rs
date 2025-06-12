#[derive(Clone)]
pub struct Whitelist {
  pub peers: Vec<String>,
}

impl From<&Vec<String>> for Whitelist {
  fn from(peers: &Vec<String>) -> Self {
    Self { peers: peers.clone() }
  }
}

impl Whitelist {
  pub fn new() -> Self {
    Self {
      peers: Vec::new(),
    }
  }
  pub fn add_peer(&mut self, peer_id: libp2p::PeerId) {
    let peer_id = peer_id.to_string();
    if !self.peers.contains(&peer_id) {
      self.peers.push(peer_id);
    }
  }
  pub fn remove_peer(&mut self, peer_id: &libp2p::PeerId) {
    let peer_id = peer_id.to_string();
    self.peers.retain(|p| *p != peer_id);
  }
  pub fn contains(&self, peer_id: &libp2p::PeerId) -> bool {
    let peer_id = peer_id.to_string();
    self.peers.contains(&peer_id)
  }
}