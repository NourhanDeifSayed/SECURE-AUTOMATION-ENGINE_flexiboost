ALTER TABLE oauth_connections
ADD COLUMN IF NOT EXISTS refresh_token_iv TEXT;