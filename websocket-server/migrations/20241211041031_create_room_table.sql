-- Add migration script here
CREATE TABLE room (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    end_at TIMESTAMP DEFAULT NULL
);