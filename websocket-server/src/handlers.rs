use axum::{
    extract::{Path, State, ws::{WebSocketUpgrade, WebSocket}},
    response::IntoResponse,
    Json,
};
use futures::{SinkExt, StreamExt};
use sqlx::pool;
use std::sync::Arc;
use tokio::sync::broadcast;
use crate::{dtos::CreateRoomDto, websocket::AppState};
use crate::repositories::{RoomRepository, IRoomRepository};

#[axum::debug_handler]
pub async fn create_room_handler(
    State(state): State<Arc<AppState>>,
    Json(payload): Json<CreateRoomDto>,
) -> impl IntoResponse {
    // let (tx, _) = broadcast::channel(16);
    // state.rooms.lock().unwrap().insert(payload.id, tx);

    // (axum::http::StatusCode::CREATED, "Room created")

    let (tx, _) = broadcast::channel(16);
    state.rooms.lock().unwrap().insert(payload.id.clone(), tx);

    // Insert room into database
    let room_repo = RoomRepository::new().await;
    let result = room_repo.create(&payload.id, &payload.name).await;

    match result {
        Ok(room) => (axum::http::StatusCode::CREATED, format!("Room created: {:?}", room)),
        Err(err) => {
            eprintln!("Failed to create room: {:?}", err);
            (axum::http::StatusCode::INTERNAL_SERVER_ERROR, "Failed to create room".to_string())
        }
    }
}

pub async fn ws_handler(
    State(state): State<Arc<AppState>>,
    ws: WebSocketUpgrade,
    Path(room_id): Path<String>,
) -> impl IntoResponse {
    ws.on_upgrade(move |socket| handle_socket(socket, state, room_id))
}

async fn handle_socket(mut ws: WebSocket, state: Arc<AppState>, room_id: String) {
    let mut rx = {
        let rooms = state.rooms.lock().unwrap();
        if let Some(tx) = rooms.get(&room_id) {
            tx.subscribe()
        } else {
            return;
        }
    };

    let (mut sender, mut receiver) = ws.split();

    tokio::spawn(async move {
        while let Some(Ok(msg)) = receiver.next().await {
            if let Ok(text) = msg.into_text() {
                if let Some(tx) = state.rooms.lock().unwrap().get(&room_id) {
                    if let Err(e) = tx.send(text.clone()) {
                        eprintln!("Failed to broadcast: {e}");
                    }
                }
            }
        }
    });

    while let Ok(msg) = rx.recv().await {
        println!("Received message: {msg}");
        if sender.send(axum::extract::ws::Message::Text(msg)).await.is_err() {
            break;
        }
    }
}
