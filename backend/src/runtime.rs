use std::sync::Arc;
use std::future::Future;
use tokio::{runtime::Runtime, sync::Mutex};

use crate::{gossip::{Gossip, GossipEvent}, log};

pub struct BackendRuntime {
    pub inner: Runtime,
    pub gossip_instance: Arc<Mutex<Option<Gossip>>>,
    pub event_collection: Arc<Mutex<Vec<GossipEvent>>>,
}

impl BackendRuntime {
    pub fn block_on<T: Default, F: Future<Output = T>>(&self, f: F) -> T {
        match std::panic::catch_unwind(std::panic::AssertUnwindSafe(|| {
            self.inner.block_on(f)
        })) {
            Ok(result) => result,
            Err(e) => {
                log!("Panic occurred: {:?}", e);
                T::default()
            } // Return FAIL if the closure panics
        }
    }
    pub fn spawn<F: Future<Output = ()> + Send + 'static>(&self, f: F) {
        self.inner.spawn(f);
    }
    pub async fn with_gossip_and_event<F, R>(&self, f: F) -> R
    where
        F: FnOnce(&mut Gossip, &mut Vec<GossipEvent>) -> R,
    {
        let mut gossip_guard = self.gossip_instance.lock().await;
        let mut event_guard = self.event_collection.lock().await;
    
        let Some(gossip) = gossip_guard.as_mut() else {
            panic!("Gossip instance is not initialized");
        };
        f(gossip, &mut event_guard)
    }
    pub async fn with_gossip<F, R>(&self, f: F) -> R
    where
        F: FnOnce(&mut Gossip) -> R,
    {
        let mut gossip_guard = self.gossip_instance.lock().await;
    
        let Some(gossip) = gossip_guard.as_mut() else {
            panic!("Gossip instance is not initialized");
        };
        f(gossip)
    }
    pub async fn with_event<F, R>(&self, f: F) -> R
    where
        F: FnOnce(&mut Vec<GossipEvent>) -> R,
    {
        let mut event_guard = self.event_collection.lock().await;
        f(&mut event_guard)
    }

    pub fn block_on_gossip<F, R: Default>(&self, f: F) -> R
    where
        F: FnOnce(&mut Gossip) -> R,
    {
        self.block_on(async { self.with_gossip(f).await })
    }

    pub fn block_on_event<F, R: Default>(&self, f: F) -> R
    where
        F: FnOnce(&mut Vec<GossipEvent>) -> R,
    {
        self.block_on(async { self.with_event(f).await })
    }

    pub fn block_on_gossip_and_event<F, R: Default>(&self, f: F) -> R
    where
        F: FnOnce(&mut Gossip, &mut Vec<GossipEvent>) -> R,
    {
        self.block_on(async { self.with_gossip_and_event(f).await })
    }
}