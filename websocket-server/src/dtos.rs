use serde::{Deserialize, Serialize};
use validator::Validate;

#[derive(Debug, Serialize, Deserialize, Validate)]
pub struct CreateRoomDto {
    #[validate(length(min = 3, max = 30))]
    pub id: String,
    #[validate(length(min = 3, max = 30))]
    pub name: String,
}
