use async_trait;
use chrono::{DateTime, Utc};
use sqlx::{Pool, Sqlite};

use crate::models::Room;
use crate::config::Config;
#[derive(Debug, Clone)]
pub struct RoomRepository {
    pool: Pool<Sqlite>,
}

impl RoomRepository {

    pub async  fn new() -> Self {

        let config = Config::new().await;
        let pool = config.establish_connection().await;
        sqlx::migrate!("./migrations")
            .run(&pool)
            .await
            .expect("Failed to run migrations");
        Self { pool }
    }
}

#[async_trait::async_trait]
pub trait IRoomRepository: Send + Sync {
    async fn create(&self, id: &str, name: &str) -> Result<Room, sqlx::Error>;
    async fn find_by_id(&self, id: &str) -> Result<Option<Room>, sqlx::Error>;
    async fn find_all(&self) -> Result<Vec<Room>, sqlx::Error>;
    async fn room_ended(&self, id: &str, time: DateTime<Utc>) -> Result<Room, sqlx::Error>;
}

#[async_trait::async_trait]
impl IRoomRepository for RoomRepository {
    async fn create(&self, id: &str, name: &str) -> Result<Room, sqlx::Error> {
        let now: DateTime<Utc> = Utc::now();
        let room = sqlx::query_as::<_, Room>("INSERT INTO room (id, name, created_at, ended_at) VALUES ($1, $2, $3, $4) RETURNING *")
            .bind(id)
            .bind(name)
            .bind(now)
            .bind(now)
            .fetch_one(&self.pool)
            .await?;
        Ok(room)
    }


    async fn find_by_id(&self, id: &str) -> Result<Option<Room>, sqlx::Error> {
        let room = sqlx::query_as::<_, Room>("SELECT * FROM room WHERE id = $1")
            .bind(id)
            .fetch_optional(&self.pool)
            .await?;
        Ok(room)
    }

    async fn find_all(&self) -> Result<Vec<Room>, sqlx::Error> {
        let rooms = sqlx::query_as::<_, Room>("SELECT * FROM room")
            .fetch_all(&self.pool)
            .await?;
        Ok(rooms)
    }

    async fn room_ended(&self, id: &str, time: DateTime<Utc>) -> Result<Room, sqlx::Error> {
        let room = sqlx::query_as::<_, Room>("UPDATE room SET ended_at = $1 WHERE id = $2 RETURNING *")
            .bind(time)
            .bind(id)
            .fetch_one(&self.pool)
            .await?;
        Ok(room)
    }
}
