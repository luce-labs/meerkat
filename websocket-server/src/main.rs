// src/main.rs
use axum::{routing::{get, post}, Router};
use hyper;
use std::sync::Arc;
use std::sync::Mutex;
use std::collections::HashMap;
use config::Config;
use repositories::RoomRepository;

mod config;
mod websocket;
mod handlers;
mod models;
mod repositories;
mod dtos;
mod db;

use crate::handlers::{create_room_handler, ws_handler};
use crate::websocket::AppState;


#[tokio::main]
async fn main() {
     
    let config = Config::new().await;
    let pool = config.establish_connection().await;


    let state = Arc::new(AppState {
        rooms: Arc::new(Mutex::new(HashMap::new())),
    });

    let app = Router::new()
        .route("/ws/:room_id", get(ws_handler))
        .route("/create_room", post(create_room_handler))
        .with_state(state.clone());

    let listener = tokio::net::TcpListener::bind("0.0.0.0:3000").await.unwrap();
    axum::serve(listener, app).await.unwrap();

//     hyper::Server::bind(&"127.0.0.1:3030".parse().unwrap())
//         .serve(app.into_make_service())
//         .await
//         .unwrap();
// }
}
