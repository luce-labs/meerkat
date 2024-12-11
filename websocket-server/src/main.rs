// src/main.rs
use axum::{
    routing::{get, post},
    Router,
};
use config::Config;
use std::collections::HashMap;
use std::sync::Arc;
use std::sync::Mutex;
use dotenv::dotenv;
use std::env;
use tracing_subscriber;
use tracing::info;
use tower_http::cors::{Any, CorsLayer};

mod config;
mod dtos;
mod handlers;
mod models;
mod repositories;
mod websocket;

use crate::handlers::{create_room_handler, ws_handler};
use crate::websocket::AppState;

#[tokio::main]
async fn main() {
    dotenv().ok();
    
    let address= env::var("ADDRESS").unwrap_or("0.0.0.0:3030".to_string());
    
    tracing_subscriber::fmt()
        .with_target(false) // Hides the module path in logs
        .compact()         // Compact log format
        .init();

    let config = Config::new().await;
    let _ = config.establish_connection().await;

    let state = Arc::new(AppState {
        rooms: Arc::new(Mutex::new(HashMap::new())),
    });

    let app = Router::new()
        .route("/ws/:room_id", get(ws_handler)).layer(
            CorsLayer::new()
                .allow_origin(Any)
                .allow_methods(Any)
                .allow_headers(Any), 
        )
        .route("/create_room", post(create_room_handler))
        .with_state(state);

    info!("Starting server on {}", address);

    let listener = tokio::net::TcpListener::bind(address).await.unwrap();
    axum::serve(listener, app).await.unwrap();

    info!("Server stopped");
}