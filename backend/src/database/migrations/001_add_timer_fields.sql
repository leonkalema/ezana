-- Migration: Add timer fields to game_sessions and game_moves
-- Purpose: Support 60-second chess clock with 3-strike system

USE binojo_db;

-- Add timer fields to game_sessions
ALTER TABLE game_sessions
  ADD COLUMN player1_time_remaining INT DEFAULT 60 COMMENT 'Seconds remaining for player 1',
  ADD COLUMN player2_time_remaining INT DEFAULT 60 COMMENT 'Seconds remaining for player 2',
  ADD COLUMN player1_strikes INT DEFAULT 0 COMMENT 'Timeout strikes for player 1 (max 3)',
  ADD COLUMN player2_strikes INT DEFAULT 0 COMMENT 'Timeout strikes for player 2 (max 3)',
  ADD COLUMN last_move_timestamp TIMESTAMP NULL COMMENT 'Timestamp of last move for timer calculation';

-- Add timer fields to game_moves  
ALTER TABLE game_moves
  ADD COLUMN is_auto_move BOOLEAN DEFAULT FALSE COMMENT 'True if move was auto-generated due to timeout',
  ADD COLUMN time_used_seconds INT NULL COMMENT 'Seconds used for this move';

-- Add index for timer queries
CREATE INDEX idx_game_sessions_last_move ON game_sessions(last_move_timestamp);
