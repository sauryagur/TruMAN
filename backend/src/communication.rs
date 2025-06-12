use crate::gossip::{message::MessageData, room::Room, whitelist::Whitelist};
use libp2p::PeerId;
use serde::{Deserialize, Serialize};
use serde_json::Error as SerdeError;


#[derive(Serialize, Deserialize, Debug)]
pub struct NewWolf {
    pub new_wolf_peer_id: PeerId,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct WolfVerify {
    pub old_wolf_peer_id: PeerId,
    pub old_wolf_private_key: String,
}

#[derive(Serialize, Deserialize, Debug)]
pub enum Tag {
    Critical,
    High,
    Normal
}

#[derive(Serialize, Deserialize, Debug)]
pub struct Message {
    pub message: String,
    pub tags: Vec<Tag>,
    pub timestamp: u64,
}

#[derive(Serialize, Deserialize, Debug)]
pub enum InteractionMessage {
    Ping, // Public & Private
    PingReply,
    Name, // Private
    NameReply(String),
    NewWolf(NewWolf), // Public
    WolfVerify(WolfVerify), // Public
    Message(Message), // Public
    Other,
}

#[derive(Debug)]
pub enum GetDataViaMessageError {
    NotOurChannel,
    Unauthorized,
    Serde(SerdeError),
}
impl From<serde_json::Error> for GetDataViaMessageError {
    fn from(err: serde_json::Error) -> Self {
        GetDataViaMessageError::Serde(err)
    }
}

impl InteractionMessage {
    pub fn from_msg(
        whitelist: &Whitelist,
        message_data: &MessageData,
    ) -> Result<Self, GetDataViaMessageError> {
        match (
            &message_data.room,
            serde_json::from_str(&message_data.message)?,
        ) {
            (_, Self::Ping) => Ok(Self::Ping),
            (Room::DirectMessage(_), Self::Name) => Ok(Self::Name),
            (Room::PublicRoom(_), Self::NewWolf(new_wolf)) => {
                if !whitelist.contains(&message_data.peer) {
                    return Err(GetDataViaMessageError::Unauthorized);
                }

                Ok(Self::NewWolf(new_wolf))
            }
            (Room::PublicRoom(_), Self::WolfVerify(wolf_verify)) => {
                // Why would an active wolf node send a wolf verify message?
                if whitelist.contains(&message_data.peer) {
                    return Err(GetDataViaMessageError::Unauthorized);
                }

                Ok(Self::WolfVerify(wolf_verify))
            }
            (Room::PublicRoom(_), Self::Message(message)) => {
                if !whitelist.contains(&message_data.peer) {
                    return Err(GetDataViaMessageError::Unauthorized);
                }

                Ok(Self::Message(message))
            }
            (_, _) => Ok(Self::Other),
        }
    }
}
