-- Create database
CREATE DATABASE IF NOT EXISTS binojo_db;
USE binojo_db;

-- Users table
CREATE TABLE users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    is_online BOOLEAN DEFAULT FALSE,
    last_seen TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Game sessions table
CREATE TABLE game_sessions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    game_code VARCHAR(10) UNIQUE NOT NULL,
    player1_id INT NOT NULL,
    player2_id INT NULL,
    game_state JSON NOT NULL,
    current_turn ENUM('player1', 'player2') DEFAULT 'player1',
    status ENUM('waiting', 'active', 'completed', 'abandoned') DEFAULT 'waiting',
    winner_id INT NULL,
    stake_tokens BIGINT NULL,
    rake_bps SMALLINT DEFAULT 1000,
    escrow_status ENUM('none','held','released','refunded') DEFAULT 'none',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    started_at TIMESTAMP NULL,
    ended_at TIMESTAMP NULL,
    FOREIGN KEY (player1_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (player2_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (winner_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Game moves table for history tracking
CREATE TABLE game_moves (
    id INT PRIMARY KEY AUTO_INCREMENT,
    game_session_id INT NOT NULL,
    player_id INT NOT NULL,
    move_data JSON NOT NULL,
    move_number INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (game_session_id) REFERENCES game_sessions(id) ON DELETE CASCADE,
    FOREIGN KEY (player_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Matchmaking queue table
CREATE TABLE matchmaking_queue (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Indexes for better performance
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_online ON users(is_online);
CREATE INDEX idx_game_sessions_code ON game_sessions(game_code);
CREATE INDEX idx_game_sessions_status ON game_sessions(status);
CREATE INDEX idx_game_sessions_players ON game_sessions(player1_id, player2_id);
CREATE INDEX idx_game_moves_session ON game_moves(game_session_id);
CREATE INDEX idx_matchmaking_queue_created ON matchmaking_queue(created_at);

-- Wallet: user balances
CREATE TABLE user_balances (
    user_id INT PRIMARY KEY,
    balance_tokens BIGINT DEFAULT 0,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Wallet: immutable ledger
CREATE TABLE ledger_transactions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NULL, -- null for house/binojo
    kind ENUM('deposit','withdrawal','stake_hold','stake_refund','payout_win','rake') NOT NULL,
    direction ENUM('credit','debit') NOT NULL,
    amount_tokens BIGINT NOT NULL,
    reference VARCHAR(64) NULL, -- e.g., game_code or payment id
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX idx_ledger_user ON ledger_transactions(user_id, created_at);
CREATE INDEX idx_ledger_ref ON ledger_transactions(reference);
