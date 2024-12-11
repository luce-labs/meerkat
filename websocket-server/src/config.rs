#[derive(Debug, Clone)]
pub struct Config {
    pub database_url: String,
    pub port: u16,
}

impl Config {
    pub async fn new() -> Config {
        let database_url = std::env::var("DATABASE_URL").expect("DATABASE_URL must be set");

        Config {
            database_url,
            port: 8000,
        }
    }

    pub async fn establish_connection(&self) -> sqlx::Pool<sqlx::Sqlite> {
        sqlx::Pool::connect(&self.database_url).await.unwrap()
    }
}
