-- Migration: Add withdrawal_requests and deposit_orders tables for PayPal integration
-- Created: 2026-01-17

-- Deposit orders table (for PayPal Checkout)
CREATE TABLE IF NOT EXISTS deposit_orders (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    order_id VARCHAR(64) UNIQUE NOT NULL,
    amount_usd DECIMAL(10, 2) NOT NULL,
    amount_tokens BIGINT NOT NULL,
    status ENUM('pending', 'completed', 'failed', 'cancelled') DEFAULT 'pending',
    paypal_transaction_id VARCHAR(64) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_deposit_user ON deposit_orders(user_id, created_at);
CREATE INDEX idx_deposit_order ON deposit_orders(order_id);
CREATE INDEX idx_deposit_status ON deposit_orders(status);

-- Withdrawal requests table
CREATE TABLE IF NOT EXISTS withdrawal_requests (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    amount_tokens BIGINT NOT NULL,
    amount_usd DECIMAL(10, 2) NOT NULL,
    paypal_email VARCHAR(255) NOT NULL,
    status ENUM('pending', 'processing', 'completed', 'failed', 'cancelled') DEFAULT 'pending',
    paypal_batch_id VARCHAR(64) NULL,
    paypal_payout_item_id VARCHAR(64) NULL,
    failure_reason TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    processed_at TIMESTAMP NULL,
    completed_at TIMESTAMP NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Indexes for withdrawal requests
CREATE INDEX idx_withdrawal_user ON withdrawal_requests(user_id, created_at);
CREATE INDEX idx_withdrawal_status ON withdrawal_requests(status);
CREATE INDEX idx_withdrawal_paypal_batch ON withdrawal_requests(paypal_batch_id);

-- Add withdrawal kind to ledger if not exists (safe to run multiple times)
-- Note: The schema already has 'withdrawal' in the ENUM, but we ensure it's there
ALTER TABLE ledger_transactions 
MODIFY COLUMN kind ENUM('deposit','withdrawal','stake_hold','stake_refund','payout_win','rake','stake_payout') NOT NULL;
