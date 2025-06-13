use backend::*;
use backend::ffi::FFIList;

fn print_events(events: FFIList) {
    println!("{:?}", events.to_vec());
}


fn main() {
    let whitelist = vec![];
    let whitelist = FFIList::from_vec(&whitelist).spread();
    init(whitelist.0, whitelist.1, whitelist.2);
    start_gossip_loop();
    let mut i = 0;
    loop {
        if i > 5 {
            print_events(collect_events());
            break;
        }
        std::thread::sleep(std::time::Duration::from_secs(1));
        ping_test();
        i += 1;
    }
    println!("Hello, world!");
}
