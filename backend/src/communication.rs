use crate::gossip::{message::MessageData, room::Room};
use libp2p::PeerId;
use serde::{Deserialize, Serialize};
use serde_json::Error as SerdeError;

#[derive(Serialize, Deserialize, Debug)]
pub enum InteractionMessage {
    Ping,
    Other(String),
}

#[derive(Debug)]
pub enum GetDataViaMessageError {
    NotOurChannel,
    Serde(SerdeError),
}
impl From<serde_json::Error> for GetDataViaMessageError {
    fn from(err: serde_json::Error) -> Self {
        GetDataViaMessageError::Serde(err)
    }
}

impl InteractionMessage {
    pub fn from_msg(
        _self_peer_id: PeerId,
        message_data: &MessageData,
    ) -> Result<Self, GetDataViaMessageError> {
        match (
            &message_data.room,
            serde_json::from_str(&message_data.message)?,
        ) {
            (_, Self::Ping) => Ok(Self::Ping),
            (Room::PublicRoom(_), e) => Ok(Self::Other(format!("Public room: {:?}", e))),
            // we can't have request public key in public room, because the group gets flooded with everyone saying their public keys
            (_, Self::Other(e)) => Ok(Self::Other(e)),
        }
    }
}
