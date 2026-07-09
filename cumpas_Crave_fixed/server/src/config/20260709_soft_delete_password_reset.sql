ALTER TABLE users
    ADD COLUMN IF NOT EXISTS password_reset_token_hash TEXT,
    ADD COLUMN IF NOT EXISTS password_reset_expires_at TIMESTAMP;

ALTER TABLE menu_items
    ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP,
    ADD COLUMN IF NOT EXISTS deleted_by INTEGER REFERENCES users(id) ON DELETE SET NULL;

ALTER TABLE cafes
    ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP,
    ADD COLUMN IF NOT EXISTS deleted_by INTEGER REFERENCES users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_users_password_reset_token_hash
    ON users(password_reset_token_hash);

CREATE INDEX IF NOT EXISTS idx_menu_items_deleted_at
    ON menu_items(deleted_at);

CREATE INDEX IF NOT EXISTS idx_cafes_deleted_at
    ON cafes(deleted_at);
