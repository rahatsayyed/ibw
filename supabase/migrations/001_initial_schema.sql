-- =====================================================
-- Cardano Freelance Platform (Talendro) - Database Schema
-- =====================================================
-- This migration creates all necessary tables for the platform
-- RLS is disabled for all tables as requested
-- =====================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- ENUM Types
-- =====================================================

CREATE TYPE project_status AS ENUM (
  'open',
  'accepted',
  'submitted',
  'completed',
  'disputed',
  'cancelled'
);

CREATE TYPE dispute_state AS ENUM (
  'pending',
  'ai_resolved',
  'human_review',
  'resolved'
);

CREATE TYPE notification_type AS ENUM (
  'project_accepted',
  'work_submitted',
  'dispute_raised',
  'ai_analysis_complete',
  'redispute_window_ending',
  'arbitrator_assigned',
  'funds_released',
  'penalty_applied',
  'project_cancelled'
);

-- =====================================================
-- Users Table (Extended Profile Data)
-- =====================================================

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  wallet_address TEXT UNIQUE NOT NULL,
  username TEXT UNIQUE NOT NULL,
  email TEXT,
  profile_image_url TEXT,
  bio TEXT,
  
  -- Blockchain sync data (cached from on-chain Profile NFT)
  total_balance BIGINT DEFAULT 0,
  available_balance BIGINT DEFAULT 0,
  locked_balance BIGINT DEFAULT 0,
  active_projects_as_client INTEGER DEFAULT 0,
  active_projects_as_freelancer INTEGER DEFAULT 0,
  reputation_score INTEGER DEFAULT 0,
  total_projects_completed INTEGER DEFAULT 0,
  total_disputes_raised INTEGER DEFAULT 0,
  fraud_count INTEGER DEFAULT 0,
  
  -- Metadata
  profile_nft_policy_id TEXT,
  profile_nft_asset_name TEXT,
  last_blockchain_sync TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- Projects Table (Metadata and Details)
-- =====================================================

CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Relationships
  client_id UUID REFERENCES users(id) ON DELETE CASCADE,
  freelancer_id UUID REFERENCES users(id) ON DELETE SET NULL,
  
  -- Project Details
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  success_criteria TEXT NOT NULL,
  github_repo_url TEXT NOT NULL,
  
  -- Financial
  payment_amount BIGINT NOT NULL, -- in lovelace
  collateral_rate INTEGER NOT NULL CHECK (collateral_rate IN (5, 10)), -- percentage
  platform_fee BIGINT NOT NULL, -- 2% of payment, in lovelace
  minimum_completion_percentage INTEGER DEFAULT 80 CHECK (minimum_completion_percentage >= 70 AND minimum_completion_percentage <= 100),
  
  -- Timeline
  deadline TIMESTAMPTZ NOT NULL,
  accepted_at TIMESTAMPTZ,
  submitted_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  
  -- Status
  status project_status DEFAULT 'open',
  
  -- Blockchain data
  project_nft_policy_id TEXT,
  project_nft_asset_name TEXT,
  escrow_utxo_hash TEXT,
  
  -- Content Hashes (for verification)
  description_hash TEXT,
  criteria_hash TEXT,
  repo_hash TEXT,
  
  -- Metadata storage
  metadata_json_url TEXT, -- Supabase storage URL
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- Project Submissions Table
-- =====================================================

CREATE TABLE project_submissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  freelancer_id UUID REFERENCES users(id) ON DELETE CASCADE,
  
  pr_url TEXT NOT NULL,
  submission_notes TEXT,
  submitted_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- Disputes Table
-- =====================================================

CREATE TABLE disputes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Relationships
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  initiated_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  arbitrator_id UUID REFERENCES users(id) ON DELETE SET NULL,
  
  -- Dispute Details
  reason TEXT NOT NULL,
  evidence_links TEXT[], -- Array of URLs
  
  -- AI Analysis
  ai_decision_winner TEXT, -- 'client' or 'freelancer'
  ai_completion_percentage INTEGER,
  ai_confidence_score DECIMAL(3, 2), -- 0.00 to 1.00
  ai_reasoning TEXT,
  ai_analyzed_at TIMESTAMPTZ,
  
  -- Re-dispute
  redispute_requested BOOLEAN DEFAULT FALSE,
  redispute_reason TEXT,
  redispute_deadline TIMESTAMPTZ, -- 7 days after AI decision
  
  -- Human Arbitration
  arbitrator_decision TEXT, -- 'client', 'freelancer', or 'partial'
  arbitrator_completion_percentage INTEGER,
  arbitrator_notes TEXT,
  arbitrator_decided_at TIMESTAMPTZ,
  
  -- State
  state dispute_state DEFAULT 'pending',
  
  -- Blockchain data
  dispute_nft_policy_id TEXT,
  dispute_nft_asset_name TEXT,
  dispute_utxo_hash TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- Arbitrators Table
-- =====================================================

CREATE TABLE arbitrators (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  
  -- Eligibility
  is_available BOOLEAN DEFAULT FALSE,
  
  -- Stats (synced from blockchain)
  arbitration_score INTEGER DEFAULT 0,
  total_cases_resolved INTEGER DEFAULT 0,
  accuracy_rate DECIMAL(5, 2) DEFAULT 0.00, -- percentage
  
  -- Blockchain data
  arbitrator_utxo_hash TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- Notifications Table
-- =====================================================

CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  
  type notification_type NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  
  -- Links
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  dispute_id UUID REFERENCES disputes(id) ON DELETE SET NULL,
  
  -- Status
  is_read BOOLEAN DEFAULT FALSE,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- Project History (Audit Trail)
-- =====================================================

CREATE TABLE project_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  
  action TEXT NOT NULL, -- 'created', 'accepted', 'submitted', 'approved', 'disputed', etc.
  actor_id UUID REFERENCES users(id) ON DELETE SET NULL,
  details JSONB,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- Indexes for Performance
-- =====================================================

-- Users indexes
CREATE INDEX idx_users_wallet_address ON users(wallet_address);
CREATE INDEX idx_users_username ON users(username);

-- Projects indexes
CREATE INDEX idx_projects_client_id ON projects(client_id);
CREATE INDEX idx_projects_freelancer_id ON projects(freelancer_id);
CREATE INDEX idx_projects_status ON projects(status);
CREATE INDEX idx_projects_deadline ON projects(deadline);
CREATE INDEX idx_projects_created_at ON projects(created_at DESC);

-- Disputes indexes
CREATE INDEX idx_disputes_project_id ON disputes(project_id);
CREATE INDEX idx_disputes_arbitrator_id ON disputes(arbitrator_id);
CREATE INDEX idx_disputes_state ON disputes(state);

-- Notifications indexes
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);

-- Project history indexes
CREATE INDEX idx_project_history_project_id ON project_history(project_id);
CREATE INDEX idx_project_history_created_at ON project_history(created_at DESC);

-- =====================================================
-- Triggers for Updated At
-- =====================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_disputes_updated_at BEFORE UPDATE ON disputes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_arbitrators_updated_at BEFORE UPDATE ON arbitrators
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- Disable RLS (Row Level Security) for all tables
-- =====================================================

ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE projects DISABLE ROW LEVEL SECURITY;
ALTER TABLE project_submissions DISABLE ROW LEVEL SECURITY;
ALTER TABLE disputes DISABLE ROW LEVEL SECURITY;
ALTER TABLE arbitrators DISABLE ROW LEVEL SECURITY;
ALTER TABLE notifications DISABLE ROW LEVEL SECURITY;
ALTER TABLE project_history DISABLE ROW LEVEL SECURITY;

-- =====================================================
-- Grant Permissions
-- =====================================================

-- Grant all privileges to anon and authenticated roles
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated;

-- =====================================================
-- Seed Data (Optional - for testing)
-- =====================================================

-- You can add sample data here if needed for development

COMMENT ON TABLE users IS 'Extended user profile data, synced with on-chain Profile NFT';
COMMENT ON TABLE projects IS 'Project metadata and status, linked to on-chain Project UTxOs';
COMMENT ON TABLE disputes IS 'Dispute information with AI and arbitrator decisions';
COMMENT ON TABLE arbitrators IS 'Arbitrator eligibility and statistics';
COMMENT ON TABLE notifications IS 'User notifications for platform events';
COMMENT ON TABLE project_history IS 'Audit trail for all project state changes';
