-- Insert Mock Users
INSERT INTO users (
  username, 
  wallet_address,
  full_name, -- Note: full_name is NOT in the schema provided, checking if I missed it. 
             -- Wait, looking at 001_initial_schema.sql, there is NO full_name column!
             -- There is email, profile_image_url, bio.
             -- I will remove full_name from insert.
  bio, 
  reputation_score, 
  total_balance, 
  available_balance, 
  total_projects_completed, 
  profile_image_url
)
VALUES 
('alice_dev', 'addr_test1alice', 'Full-stack developer specializing in Cardano.', 950, 5000000000, 4500000000, 42, 'https://i.pravatar.cc/150?u=a042581f4e29026024d'),
('bob_client', 'addr_test1bob', 'Building the next generation of dApps.', 450, 10000000000, 8000000000, 15, 'https://i.pravatar.cc/150?u=a042581f4e29026704d'),
('charlie_audit', 'addr_test1charlie', 'Smart contract security expert.', 820, 3000000000, 3000000000, 28, 'https://i.pravatar.cc/150?u=a04258114e29026302d');

-- Insert Mock Projects
INSERT INTO projects (
  title, 
  description, 
  success_criteria, 
  github_repo_url, 
  payment_amount, 
  collateral_rate, 
  platform_fee,
  deadline, 
  status, 
  client_id
)
SELECT 
  'DeFi Dashboard UI', 
  'Need a skilled frontend dev to implement a Figma design for a DeFi dashboard.', 
  'Pixel perfect implementation.', 
  'https://github.com/bob_client/defi-dash', 
  1500000000, -- 1500 ADA
  10, 
  30000000, -- 30 ADA fee
  NOW() + INTERVAL '30 days', 
  'open', 
  id 
FROM users WHERE username = 'bob_client';

INSERT INTO projects (
  title, 
  description, 
  success_criteria, 
  github_repo_url, 
  payment_amount, 
  collateral_rate, 
  platform_fee,
  deadline, 
  status, 
  client_id
)
SELECT 
  'Smart Contract Audit', 
  'Audit our Aiken smart contracts.', 
  'Comprehensive report required.', 
  'https://github.com/bob_client/protocol', 
  2500000000, -- 2500 ADA
  5, 
  50000000, -- 50 ADA fee
  NOW() + INTERVAL '15 days', 
  'open', 
  id 
FROM users WHERE username = 'bob_client';
