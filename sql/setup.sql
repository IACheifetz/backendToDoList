-- Use this file to define your SQL tables
-- The SQL in this file will be executed when you run `npm run setup-db`
--clears tables before use if necessary, cascades to delete entries even with foreign relations
DROP TABLE IF EXISTS todos CASCADE;
DROP TABLE IF EXISTS users CASCADE;

--sets up a table with columns for ID, email and a pword hash
CREATE TABLE users (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  email VARCHAR NOT NULL UNIQUE,
  password_hash VARCHAR NOT NULL
);

--sets up a table with columns for ID, a user ID associated from the user table, description for the to-do item and a boolean for checking if an item has been completed
CREATE TABLE todos (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id BIGINT ,
  description VARCHAR NOT NULL,
  complete BOOLEAN NOT NULL DEFAULT(false),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  FOREIGN KEY (user_id) REFERENCES users(id)
)
