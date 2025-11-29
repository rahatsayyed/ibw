-- =====================================================
-- Wallet Verification Enhancement
-- =====================================================
-- This migration adds wallet verification requirements
-- Run this AFTER the initial schema migration (001_initial_schema.sql)
-- =====================================================

-- Make wallet_address required and unique
ALTER TABLE users 
  ALTER COLUMN wallet_address SET NOT NULL,
  ADD CONSTRAINT users_wallet_address_unique UNIQUE (wallet_address);

-- Add wallet_verified field
ALTER TABLE users 
  ADD COLUMN wallet_verified BOOLEAN DEFAULT FALSE;

-- Add index for wallet verification lookups
CREATE INDEX idx_users_wallet_verified ON users(wallet_verified);

-- Comment on new field
COMMENT ON COLUMN users.wallet_verified IS 'Whether the user has connected and verified their wallet address';
