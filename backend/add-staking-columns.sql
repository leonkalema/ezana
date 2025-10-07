-- Add staking columns to game_sessions table (ignore errors if columns exist)
ALTER TABLE game_sessions ADD COLUMN stake_tokens INT DEFAULT 0;
ALTER TABLE game_sessions ADD COLUMN rake_bps INT DEFAULT 1000;
ALTER TABLE game_sessions ADD COLUMN escrow_status ENUM('none', 'held', 'finalized') DEFAULT 'none';

-- Create user_balances table
CREATE TABLE IF NOT EXISTS user_balances (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL UNIQUE,
  balance_tokens INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_balance (user_id)
);

-- Create ledger_transactions table
CREATE TABLE IF NOT EXISTS ledger_transactions (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  kind ENUM('deposit', 'stake_hold', 'stake_payout', 'stake_refund') NOT NULL,
  direction ENUM('credit', 'debit') NOT NULL,
  amount INT NOT NULL,
  reference VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_transactions (user_id, created_at DESC),
  INDEX idx_reference (reference)
);
