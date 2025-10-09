-- Add stake_tokens field to matchmaking_queue table
ALTER TABLE matchmaking_queue 
ADD COLUMN stake_tokens INT DEFAULT 0 NOT NULL;

-- Add index for stake-based matchmaking
CREATE INDEX idx_matchmaking_stake ON matchmaking_queue(stake_tokens, created_at);
