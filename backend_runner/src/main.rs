use backend::*;

fn main() {
    init(vec![].as_ptr(), vec![].as_ptr(), 0);
    start_gossip_loop();
    let mut i = 0;
    loop {
        if i > 5 {
            break;
        }
        std::thread::sleep(std::time::Duration::from_secs(1));
        i += 1;
    }
    println!("Hello, world!");
}
