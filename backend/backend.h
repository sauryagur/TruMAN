#include <cstdarg>
#include <cstdint>
#include <cstdlib>
#include <ostream>
#include <new>

struct FFIList {
  uint8_t **ptr;
  uintptr_t *sizes_ptr;
  uintptr_t size;
};

extern "C" {

void init(uint8_t **whitelist_ptr, uintptr_t *whitelist_sizes_ptr, uintptr_t whitelist_size);

void start_gossip_loop();

FFIList collect_events();

void ping(const uint8_t *target, uintptr_t target_size);

void new_wolf(const uint8_t *new_wolf_peer_id, uintptr_t new_wolf_peer_id_size);

}  // extern "C"
