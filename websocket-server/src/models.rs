use serde::{Deserialize, Serialize};
use chrono::prelude::*;

#[derive(sqlx::FromRow, Debug, Serialize, Deserialize, Clone)]
pub struct Room {
    pub id: String,
    pub name: String,
    pub created_at: DateTime<Utc>,
    pub ended_at: Option<DateTime<Utc>>,
}
