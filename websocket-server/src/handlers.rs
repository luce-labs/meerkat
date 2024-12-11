use crate::repositories::{IRoomRepository, RoomRepository};
use crate::{dtos::CreateRoomDto, websocket::AppState};
use axum::{
    extract::{
        ws::{Message, WebSocket, WebSocketUpgrade},
        State,
    },
    response::IntoResponse,
    Json,
};
use futures::{SinkExt, StreamExt};
use std::sync::Arc;
use tokio::sync::broadcast;
use tracing::{info, error};

#[axum::debug_handler]
pub async fn create_room_handler(
    State(state): State<Arc<AppState>>,
    Json(payload): Json<CreateRoomDto>,
) -> impl IntoResponse {
    let (tx, _) = broadcast::channel(100);
    state.rooms.lock().unwrap().insert(payload.id.clone(), tx);

    let room_repo = RoomRepository::new().await;
    let result = room_repo.create(&payload.id, &payload.name).await;
    match result {
        Ok(room) => (
            axum::http::StatusCode::CREATED,
            info!("Room created: {:?}", room),
        ),
        Err(err) => {
            (
                axum::http::StatusCode::INTERNAL_SERVER_ERROR,
                error!("Failed to create room: {:?}", err),
            )
        }
    }
}

pub async fn ws_handler(
    State(state): State<Arc<AppState>>,
    ws: WebSocketUpgrade,
) -> impl IntoResponse {
    ws.on_upgrade(move |socket| handle_socket(socket, state))
}

async fn handle_socket(ws: WebSocket, state: Arc<AppState>) {
    info!("New WebSocket connection");
    
    // Create a broadcast channel for this connection
    let (tx, _) = broadcast::channel(100);
    let mut rx = tx.subscribe();
    
    let (mut sender, mut receiver) = ws.split();
    let sender = Arc::new(tokio::sync::Mutex::new(sender));
    let sender_clone = Arc::clone(&sender);
    
    tokio::spawn({
        let tx = tx.clone();
        async move {
            while let Some(Ok(msg)) = receiver.next().await {
                match msg {
                    Message::Text(text) => {
                        if let Err(e) = tx.send(text.clone()) {
                            error!("Failed to broadcast text: {e}");
                        }
                        info!("Message sent: {text}");
                    }
                    Message::Binary(binary) => {
                        // Directly send binary data without conversion
                        if let Err(e) = tx.send(base64::encode(binary.clone())) {
                            error!("Failed to broadcast binary: {e}");
                        }
                        info!("Binary message received: {:?}", binary);
                    }
                    Message::Ping(ping_data) => {
                        let mut sender = sender_clone.lock().await;
                        sender.send(Message::Pong(ping_data.clone())).await.ok();
                        info!("Pong sent: {:?}", ping_data);
                    }
                    Message::Pong(_) => {}
                    Message::Close(_) => {
                        break;
                    }
                }
            }
        }
    });

    let mut sender = sender.lock().await;
    while let Ok(msg) = rx.recv().await {
        // Send the message as binary
        if sender.send(Message::Binary(msg.into_bytes())).await.is_err() {
            error!("Failed to send message");
            break;
        }
    }
}