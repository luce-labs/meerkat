use std::collections::HashMap;
use std::sync::{Arc, Mutex};
use tokio::sync::broadcast;

#[derive(Clone)]
pub struct AppState {
    pub rooms: Arc<Mutex<HashMap<String, broadcast::Sender<Vec<u8>>>>>,
}

impl AppState {
    pub fn new() -> Self {
        Self {
            rooms: Arc::new(Mutex::new(HashMap::new())),
        }
    }

    pub fn create_or_join_room(&self, room_id: String) -> broadcast::Sender<Vec<u8>> {
    let mut rooms = self.rooms.lock().unwrap();
    
    // If room doesn't exist, create it
    rooms.entry(room_id.clone()).or_insert_with(|| {
        let (tx, _) = broadcast::channel(100);
        tx
    }).clone()
}
}
