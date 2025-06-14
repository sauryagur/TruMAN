// If anyone else wants to try & figure this out, update the the counter below
// Hours wasted trying to figure this out: 4

use std::{sync::Arc, time::Duration};
use tokio::sync::Mutex;

lazy_static::lazy_static! {
    static ref INSTANCE: Arc<Mutex<Option<bool>>> = Arc::new(Mutex::new(None));
}

use crate::backend::UniFfiTag;

/// Async function that says something after a certain time.
#[uniffi::export]
pub async fn say_after(ms: u64, who: String) -> String {
    let mut guard = INSTANCE.lock().await;
    if guard.is_none() {
        *guard = Some(true);
    }
    drop(guard); // Release the lock before sleeping
    tokio::time::sleep(Duration::from_millis(ms)).await;
    format!("Hello, {who}!")
}

#[cfg(feature = "lib")]
mod backend {
    use uniffi::include_scaffolding;
    use crate::say_after;

    include_scaffolding!("backend");
}