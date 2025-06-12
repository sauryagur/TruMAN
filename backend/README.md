# The backend interations

Maybe don't include the name thing
| Receive | Reply |
|-|-|
|ping|ping.reply|{}|{}|
|name|name.reply|{}|{ name }|

If any sheep node sends the following messages, block them
| Receive | Reply |
|-|-|
|new_wolf|NONE|{ new_wolf_peer_id }|{}|
|wolf_verify|NONE|{ old_wolf_peer_id, old_wolf_private_key }
|message|NONE|{ message, tags, timestamp }|{}|