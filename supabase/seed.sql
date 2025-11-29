-- Create Users Table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  bio TEXT,
  wallet_address TEXT UNIQUE,
  wallet_verified BOOLEAN DEFAULT FALSE,
  total_balance NUMERIC DEFAULT 0,
  available_balance NUMERIC DEFAULT 0,
  locked_balance NUMERIC DEFAULT 0,
  reputation INTEGER DEFAULT 0,
  projects_completed INTEGER DEFAULT 0,
  projects_as_client INTEGER DEFAULT 0,
  projects_as_freelancer INTEGER DEFAULT 0,
  disputes_raised INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create Projects Table
CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  criteria TEXT NOT NULL,
  repo_url TEXT NOT NULL,
  payment_amount NUMERIC NOT NULL,
  collateral_rate NUMERIC NOT NULL,
  min_completion_percentage INTEGER DEFAULT 80,
  deadline TIMESTAMPTZ NOT NULL,
  status TEXT DEFAULT 'Open', -- Open, Accepted, Submitted, Completed, Disputed, Cancelled
  client_id UUID REFERENCES users(id),
  freelancer_id UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create Disputes Table
CREATE TABLE IF NOT EXISTS disputes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id),
  initiator_id UUID REFERENCES users(id),
  reason TEXT NOT NULL,
  evidence_links TEXT[],
  status TEXT DEFAULT 'Pending', -- Pending, AI Analysis, Human Review, Resolved
  amount_at_stake NUMERIC NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert Mock Users
INSERT INTO users (username, full_name, bio, reputation, total_balance, available_balance, projects_completed, avatar_url)
VALUES 
('alice_dev', 'Alice Developer', 'Full-stack developer specializing in Cardano.', 950, 5000, 4500, 42, 'https://i.pravatar.cc/150?u=a042581f4e29026024d'),
('bob_client', 'Bob The Builder', 'Building the next generation of dApps.', 450, 10000, 8000, 15, 'https://i.pravatar.cc/150?u=a042581f4e29026704d'),
('charlie_audit', 'Charlie Auditor', 'Smart contract security expert.', 820, 3000, 3000, 28, 'https://i.pravatar.cc/150?u=a04258114e29026302d');

-- Insert Mock Projects
INSERT INTO projects (title, description, criteria, repo_url, payment_amount, collateral_rate, deadline, status, client_id)
SELECT 
  'DeFi Dashboard UI', 
  'Need a skilled frontend dev to implement a Figma design for a DeFi dashboard.', 
  'Pixel perfect implementation.', 
  'https://github.com/bob_client/defi-dash', 
  1500, 
  10, 
  NOW() + INTERVAL '30 days', 
  'Open', 
  id 
FROM users WHERE username = 'bob_client';

INSERT INTO projects (title, description, criteria, repo_url, payment_amount, collateral_rate, deadline, status, client_id)
SELECT 
  'Smart Contract Audit', 
  'Audit our Aiken smart contracts.', 
  'Comprehensive report required.', 
  'https://github.com/bob_client/protocol', 
  2500, 
  5, 
  NOW() + INTERVAL '15 days', 
  'Open', 
  id 
FROM users WHERE username = 'bob_client';
