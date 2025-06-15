#ifndef TRUMAN_BACKEND_H
#define TRUMAN_BACKEND_H

#include <cstdarg>
#include <cstdint>
#include <cstdlib>
#include <ostream>
#include <new>

#ifdef __cplusplus
extern "C" {
#endif

/**
 * Structure to pass string lists between languages
 */
struct FFIList {
  uint8_t **ptr;        // Array of strings
  uintptr_t *sizes_ptr; // Array of string lengths
  uintptr_t size;       // Number of strings
};

/**
 * Initializes the P2P network with an optional whitelist of peer IDs
 * 
 * @param whitelist_ptr Array of string pointers containing peer IDs
 * @param whitelist_sizes_ptr Array of string sizes
 * @param whitelist_size Number of strings in the array
 * @return 1 if successful, 0 on error
 */
int init(uint8_t **whitelist_ptr, uintptr_t *whitelist_sizes_ptr, uintptr_t whitelist_size);

/**
 * Starts the gossip event loop to process network events in the background
 */
void start_gossip_loop();

/**
 * Collects events (messages, connections, etc.) from the network
 * 
 * @return FFIList containing JSON-serialized events
 */
FFIList collect_events();

/**
 * Sends a ping to a specific peer
 * 
 * @param target Byte representation of the peer ID to ping
 * @param target_size Size of the peer ID
 * @return 1 if ping sent successfully, 0 on error
 */
int ping(const uint8_t *target, uintptr_t target_size);

/**
 * Gets a list of connected peers
 * 
 * @return FFIList containing peer ID strings
 */
FFIList get_peers();

/**
 * Sends a message to the network
 * 
 * @param message Message content
 * @param message_size Size of the message
 * @param tag Message tag/type
 * @param tag_size Size of the tag
 * @return 1 if message sent successfully, 0 on error
 */
int broadcast_message(uint8_t *message, uintptr_t message_size, 
                     const uint8_t *tag, uintptr_t tag_size);

/**
 * Promotes a peer to wolf status
 * 
 * @param new_wolf_peer_id Peer ID to promote to wolf
 * @param new_wolf_peer_id_size Size of the peer ID
 * @return 1 if successfully set, 0 on error
 */
int new_wolf(const uint8_t *new_wolf_peer_id, uintptr_t new_wolf_peer_id_size);

/**
 * Gets the local peer ID
 * 
 * @return String containing the local peer ID
 */
FFIList get_local_peer_id();

/**
 * Cleans up resources - call before shutting down
 */
void cleanup();

#ifdef __cplusplus
}  // extern "C"
#endif

#endif // TRUMAN_BACKEND_H
