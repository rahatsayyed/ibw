-- =====================================================
-- Clear Existing Data
-- =====================================================
TRUNCATE TABLE notifications CASCADE;
TRUNCATE TABLE project_history CASCADE;
TRUNCATE TABLE project_submissions CASCADE;
TRUNCATE TABLE disputes CASCADE;
TRUNCATE TABLE projects CASCADE;
TRUNCATE TABLE arbitrators CASCADE;
TRUNCATE TABLE users CASCADE;

-- =====================================================
-- Insert Mock Users (10 users)
-- =====================================================
-- Password for all users: password123
-- This assumes you're using Supabase Auth, so these should be created via auth.users
-- For testing purposes, we'll insert into public.users table
-- NOTE: You'll need to create these users in Supabase Auth UI or via API with password: password123

INSERT INTO users (
  id,
  username, 
  wallet_address,
  email,
  bio, 
  reputation_score, 
  total_balance, 
  available_balance,
  locked_balance,
  total_projects_completed,
  active_projects_as_client,
  active_projects_as_freelancer,
  profile_image_url
)
VALUES 
-- User 1: Alice (Full-stack Developer)
(
  '11111111-1111-1111-1111-111111111111'::uuid,
  'alice_dev',
  'addr_test1alice',
  'alice@example.com',
  'Full-stack developer specializing in React, Node.js, and Cardano smart contracts.',
  950,
  5000000000,
  4500000000,
  500000000,
  42,
  2,
  3,
  'https://i.pravatar.cc/150?u=alice'
),
-- User 2: Bob (Project Manager / Client)
(
  '22222222-2222-2222-2222-222222222222'::uuid,
  'bob_client',
  'addr_test1bob',
  'bob@example.com',
  'Building the next generation of dApps. Looking for talented developers.',
  450,
  10000000000,
  8000000000,
  2000000000,
  15,
  5,
  0,
  'https://i.pravatar.cc/150?u=bob'
),
-- User 3: Charlie (Security Auditor)
(
  '33333333-3333-3333-3333-333333333333'::uuid,
  'charlie_audit',
  'addr_test1charlie',
  'charlie@example.com',
  'Smart contract security expert. Specialized in Aiken and Plutus audits.',
  820,
  3000000000,
  3000000000,
  0,
  28,
  1,
  2,
  'https://i.pravatar.cc/150?u=charlie'
),
-- User 4: Diana (UI/UX Designer)
(
  '44444444-4444-4444-4444-444444444444'::uuid,
  'diana_design',
  'addr_test1diana',
  'diana@example.com',
  'UI/UX designer with expertise in Figma, Web3 interfaces, and user research.',
  680,
  2500000000,
  2200000000,
  300000000,
  35,
  0,
  1,
  'https://i.pravatar.cc/150?u=diana'
),
-- User 5: Ethan (Backend Developer)
(
  '55555555-5555-5555-5555-555555555555'::uuid,
  'ethan_backend',
  'addr_test1ethan',
  'ethan@example.com',
  'Backend specialist. Python, Rust, and distributed systems expert.',
  890,
  4500000000,
  4000000000,
  500000000,
  50,
  1,
  3,
  'https://i.pravatar.cc/150?u=ethan'
),
-- User 6: Fiona (Smart Contract Developer)
(
  '66666666-6666-6666-6666-666666666666'::uuid,
  'fiona_aiken',
  'addr_test1fiona',
  'fiona@example.com',
  'Aiken smart contract developer. Building secure and efficient dApps on Cardano.',
  920,
  6000000000,
  5500000000,
  500000000,
  38,
  2,
  2,
  'https://i.pravatar.cc/150?u=fiona'
),
-- User 7: George (DevOps Engineer)
(
  '77777777-7777-7777-7777-777777777777'::uuid,
  'george_devops',
  'addr_test1george',
  'george@example.com',
  'DevOps engineer. Docker, Kubernetes, CI/CD, and cloud infrastructure.',
  750,
  3500000000,
  3200000000,
  300000000,
  30,
  0,
  2,
  'https://i.pravatar.cc/150?u=george'
),
-- User 8: Hannah (Frontend Developer)
(
  '88888888-8888-8888-8888-888888888888'::uuid,
  'hannah_frontend',
  'addr_test1hannah',
  'hannah@example.com',
  'Frontend developer. React, TypeScript, Next.js, and Tailwind CSS enthusiast.',
  840,
  4000000000,
  3700000000,
  300000000,
  45,
  1,
  3,
  'https://i.pravatar.cc/150?u=hannah'
),
-- User 9: Ian (QA Engineer)
(
  '99999999-9999-9999-9999-999999999999'::uuid,
  'ian_qa',
  'addr_test1ian',
  'ian@example.com',
  'QA engineer and testing specialist. Automated testing, security testing, and quality assurance.',
  720,
  2800000000,
  2600000000,
  200000000,
  32,
  0,
  1,
  'https://i.pravatar.cc/150?u=ian'
),
-- User 10: Julia (Data Scientist)
(
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid,
  'julia_data',
  'addr_test1julia',
  'julia@example.com',
  'Data scientist. Machine learning, AI, blockchain analytics, and data visualization.',
  790,
  3300000000,
  3100000000,
  200000000,
  25,
  1,
  1,
  'https://i.pravatar.cc/150?u=julia'
);

-- =====================================================
-- Insert Mock Projects (20-25 projects with variety)
-- =====================================================

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
VALUES
-- Project 1: DeFi Dashboard (Open)
(
  'DeFi Dashboard UI',
  'Need a skilled frontend developer to implement a Figma design for a DeFi dashboard. Must include wallet connection, token swaps, and portfolio tracking. Technologies: React, Next.js, TailwindCSS.',
  'Pixel perfect implementation matching Figma design. All interactive elements must be functional.',
  'https://github.com/bob_client/defi-dash',
  1500000000, -- 1500 ADA
  10,
  30000000, -- 30 ADA
  NOW() + INTERVAL '30 days',
  'open',
  '22222222-2222-2222-2222-222222222222'::uuid
),
-- Project 2: Smart Contract Audit (Open)
(
  'Aiken Smart Contract Security Audit',
  'Comprehensive security audit needed for our Aiken smart contracts. Looking for an experienced auditor to review our escrow and dispute resolution contracts.',
  'Detailed security report with vulnerability assessment and recommendations.',
  'https://github.com/bob_client/escrow-contracts',
  2500000000, -- 2500 ADA
  5,
  50000000, -- 50 ADA
  NOW() + INTERVAL '15 days',
  'open',
  '22222222-2222-2222-2222-222222222222'::uuid
),
-- Project 3: NFT Marketplace Backend (Open)
(
  'NFT Marketplace Backend Development',
  'Build a robust backend for an NFT marketplace. Rust or Node.js preferred. Must handle metadata, IPFS integration, and Cardano blockchain interaction.',
  'Complete REST API with documentation. All endpoints tested and production-ready.',
  'https://github.com/alice_dev/nft-marketplace',
  3000000000, -- 3000 ADA
  10,
  60000000, -- 60 ADA
  NOW() + INTERVAL '45 days',
  'open',
  '11111111-1111-1111-1111-111111111111'::uuid
),
-- Project 4: Mobile Wallet App (Open)
(
  'Cardano Mobile Wallet UI/UX Design',
  'Design a beautiful and intuitive mobile wallet interface. Should support multiple wallets, transaction history, and staking. Figma deliverables required.',
  'Complete design system with all screens, components, and user flows documented.',
  'https://github.com/diana_design/wallet-ui',
  1200000000, -- 1200 ADA
  5,
  24000000, -- 24 ADA
  NOW() + INTERVAL '20 days',
  'open',
  '44444444-4444-4444-4444-444444444444'::uuid
),
-- Project 5: DEX Integration (Open)
(
  'DEX Aggregator Integration',
  'Integrate multiple Cardano DEXs into our platform. Need developer experienced with SundaeSwap, Minswap, and WingRiders APIs. TypeScript required.',
  'Working integration with at least 3 DEXs. Price comparison and best route selection implemented.',
  'https://github.com/ethan_backend/dex-aggregator',
  2200000000, -- 2200 ADA
  10,
  44000000, -- 44 ADA
  NOW() + INTERVAL '35 days',
  'open',
  '55555555-5555-5555-5555-555555555555'::uuid
),
-- Project 6: DAO Governance Platform (Accepted)
(
  'DAO Governance Smart Contracts',
  'Build Aiken smart contracts for a DAO governance platform. Must include proposal creation, voting mechanisms, and treasury management.',
  'All smart contracts deployed on testnet. Unit tests with >90% coverage.',
  'https://github.com/fiona_aiken/dao-governance',
  3500000000, -- 3500 ADA
  10,
  70000000, -- 70 ADA
  NOW() + INTERVAL '60 days',
  'accepted',
  '11111111-1111-1111-1111-111111111111'::uuid
),
-- Project 7: CI/CD Pipeline Setup (Open)
(
  'Cardano dApp CI/CD Pipeline',
  'Set up comprehensive CI/CD pipeline for Cardano dApp. GitHub Actions, Docker, automated testing, and deployment to testnet/mainnet.',
  'Fully automated pipeline with documentation. Successful deployment to testnet demonstrated.',
  'https://github.com/george_devops/cicd-setup',
  1000000000, -- 1000 ADA
  5,
  20000000, -- 20 ADA
  NOW() + INTERVAL '14 days',
  'open',
  '77777777-7777-7777-7777-777777777777'::uuid
),
-- Project 8: Staking Pool Dashboard (Open)
(
  'Stake Pool Monitoring Dashboard',
  'Frontend dashboard for monitoring Cardano stake pool performance. Real-time data, charts, and delegation management. React, TypeScript.',
  'Live dashboard with all requested features. Responsive design for mobile and desktop.',
  'https://github.com/hannah_frontend/pool-dashboard',
  1800000000, -- 1800 ADA
  10,
  36000000, -- 36 ADA
  NOW() + INTERVAL '25 days',
  'open',
  '88888888-8888-8888-8888-888888888888'::uuid
),
-- Project 9: Automated Testing Suite (Open)
(
  'Smart Contract Testing Framework',
  'Create comprehensive automated testing suite for Aiken smart contracts. Jest, property-based testing, and integration tests.',
  'Complete test suite with >95% coverage. CI integration and documentation.',
  'https://github.com/ian_qa/testing-framework',
  900000000, -- 900 ADA
  5,
  18000000, -- 18 ADA
  NOW() + INTERVAL '18 days',
  'open',
  '99999999-9999-9999-9999-999999999999'::uuid
),
-- Project 10: Blockchain Analytics (Open)
(
  'On-chain Analytics Dashboard',
  'Build data analytics dashboard for Cardano blockchain. Python, data visualization, transaction analysis, and wallet tracking.',
  'Interactive dashboard with real-time updates. Export functionality for reports.',
  'https://github.com/julia_data/analytics-dash',
  2800000000, -- 2800 ADA
  10,
  56000000, -- 56 ADA
  NOW() + INTERVAL '40 days',
  'open',
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid
),
-- Project 11: Token Vesting Contract (Open)
(
  'Token Vesting Smart Contract',
  'Implement token vesting smart contract in Aiken. Linear vesting, cliff periods, and revocable options. Security is paramount.',
  'Audited contract deployed on testnet. Complete documentation and usage examples.',
  'https://github.com/fiona_aiken/token-vesting',
  2000000000, -- 2000 ADA
  5,
  40000000, -- 40 ADA
  NOW() + INTERVAL '30 days',
  'open',
  '66666666-6666-6666-6666-666666666666'::uuid
),
-- Project 12: Multi-sig Wallet (Open)
(
  'Multi-signature Wallet Implementation',
  'Build multi-signature wallet interface. Support for 2-of-3 and 3-of-5 signatures. Frontend and smart contract work.',
  'Working multi-sig wallet with transaction proposal and approval system.',
  'https://github.com/alice_dev/multisig-wallet',
  2600000000, -- 2600 ADA
  10,
  52000000, -- 52 ADA
  NOW() + INTERVAL '50 days',
  'open',
  '11111111-1111-1111-1111-111111111111'::uuid
),
-- Project 13: Oracle Integration (Accepted)
(
  'Chainlink Oracle Integration',
  'Integrate Chainlink oracles for price feeds. Need developer experienced with oracle patterns and Cardano.',
  'Working price feed integration with fallback mechanisms.',
  'https://github.com/ethan_backend/oracle-integration',
  1700000000, -- 1700 ADA
  10,
  34000000, -- 34 ADA
  NOW() + INTERVAL '28 days',
  'accepted',
  '55555555-5555-5555-5555-555555555555'::uuid
),
-- Project 14: Game Asset Marketplace (Open)
(
  'Gaming NFT Marketplace Frontend',
  'Build marketplace for gaming NFTs. Filter by game, rarity, price. Integration with Cardano wallets. React, Next.js.',
  'Fully functional marketplace with search, filters, and purchase flows.',
  'https://github.com/hannah_frontend/game-marketplace',
  2100000000, -- 2100 ADA
  10,
  42000000, -- 42 ADA
  NOW() + INTERVAL '35 days',
  'open',
  '88888888-8888-8888-8888-888888888888'::uuid
),
-- Project 15: Documentation Website (Open)
(
  'Developer Documentation Portal',
  'Create comprehensive documentation website for our protocol. Docusaurus or similar. API references, tutorials, code examples.',
  'Complete documentation site with search functionality and interactive examples.',
  'https://github.com/bob_client/docs-portal',
  800000000, -- 800 ADA
  5,
  16000000, -- 16 ADA
  NOW() + INTERVAL '15 days',
  'open',
  '22222222-2222-2222-2222-222222222222'::uuid
),
-- Project 16: Social Recovery Wallet (Open)
(
  'Social Recovery Wallet System',
  'Smart contract for social recovery wallet. Guardians can help recover lost wallets. Aiken development.',
  'Working recovery mechanism with guardian management and time-locks.',
  'https://github.com/fiona_aiken/social-recovery',
  2300000000, -- 2300 ADA
  10,
  46000000, -- 46 ADA
  NOW() + INTERVAL '42 days',
  'open',
  '66666666-6666-6666-6666-666666666666'::uuid
),
-- Project 17: Liquidity Pool Frontend (Open)
(
  'AMM Liquidity Pool Interface',
  'Build user interface for automated market maker. Add/remove liquidity, swap tokens, view pool stats. TypeScript, React.',
  'Intuitive UI with real-time price updates and slippage calculations.',
  'https://github.com/diana_design/amm-ui',
  1900000000, -- 1900 ADA
  10,
  38000000, -- 38 ADA
  NOW() + INTERVAL '32 days',
  'open',
  '44444444-4444-4444-4444-444444444444'::uuid
),
-- Project 18: Metadata Server (Open)
(
  'NFT Metadata API Server',
  'Build scalable metadata server for NFT collections. IPFS integration, caching, CDN. Node.js or Rust.',
  'Production-ready API with rate limiting and monitoring.',
  'https://github.com/ethan_backend/metadata-server',
  1400000000, -- 1400 ADA
  5,
  28000000, -- 28 ADA
  NOW() + INTERVAL '22 days',
  'open',
  '55555555-5555-5555-5555-555555555555'::uuid
),
-- Project 19: Security Scanner (Open)
(
  'Smart Contract Security Scanner',
  'Automated security scanner for Aiken contracts. Static analysis, vulnerability detection, best practice checks.',
  'Working scanner with detailed reports and CI integration.',
  'https://github.com/charlie_audit/security-scanner',
  2400000000, -- 2400 ADA
  5,
  48000000, -- 48 ADA
  NOW() + INTERVAL '45 days',
  'open',
  '33333333-3333-3333-3333-333333333333'::uuid
),
-- Project 20: Token Launchpad (Open)
(
  'Token Launchpad Platform',
  'Full-stack token launchpad. Fair launch mechanisms, liquidity locking, vesting. Frontend and smart contracts.',
  'Complete launchpad with admin panel and user-facing interface.',
  'https://github.com/alice_dev/token-launchpad',
  3200000000, -- 3200 ADA
  10,
  64000000, -- 64 ADA
  NOW() + INTERVAL '55 days',
  'open',
  '11111111-1111-1111-1111-111111111111'::uuid
),
-- Project 21: Portfolio Tracker (Open)
(
  'Cardano Portfolio Tracking App',
  'Mobile-first portfolio tracker. Track tokens, NFTs, staking rewards. React Native or Flutter.',
  'Cross-platform app with wallet integration and price charts.',
  'https://github.com/hannah_frontend/portfolio-tracker',
  2700000000, -- 2700 ADA
  10,
  54000000, -- 54 ADA
  NOW() + INTERVAL '48 days',
  'open',
  '88888888-8888-8888-8888-888888888888'::uuid
),
-- Project 22: Escrow Service (Disputed - for disputes seed)
(
  'Decentralized Escrow Platform',
  'Build escrow service with dispute resolution. Smart contracts and frontend. Aiken, React, TypeScript.',
  'Working escrow system with milestone-based payments.',
  'https://github.com/bob_client/escrow-platform',
  2900000000, -- 2900 ADA
  10,
  58000000, -- 58 ADA
  NOW() + INTERVAL '38 days',
  'disputed',
  '22222222-2222-2222-2222-222222222222'::uuid
),
-- Project 23: Voting System (Disputed - for disputes seed)
(
  'On-chain Voting System',
  'Implement on-chain voting with privacy features. Zero-knowledge proofs optional. Aiken smart contracts.',
  'Secure voting system with verifiable results.',
  'https://github.com/fiona_aiken/voting-system',
  3100000000, -- 3100 ADA
  5,
  62000000, -- 62 ADA
  NOW() + INTERVAL '50 days',
  'disputed',
  '66666666-6666-6666-6666-666666666666'::uuid
),
-- Project 24: Lending Protocol (Disputed - for disputes seed)
(
  'DeFi Lending Protocol',
  'Create lending/borrowing protocol. Interest calculations, liquidations, collateral management. Full-stack.',
  'Tested protocol with comprehensive documentation.',
  'https://github.com/alice_dev/lending-protocol',
  4000000000, -- 4000 ADA
  10,
  80000000, -- 80 ADA
  NOW() + INTERVAL '65 days',
  'disputed',
  '11111111-1111-1111-1111-111111111111'::uuid
),
-- Project 25: NFT Minting Platform (Disputed - for disputes seed)
(
  'No-code NFT Minting Platform',
  'User-friendly NFT minting platform. Upload art, set metadata, mint collections. React, Next.js, IPFS.',
  'Production-ready platform with payment processing.',
  'https://github.com/diana_design/nft-minter',
  2500000000, -- 2500 ADA
  10,
  50000000, -- 50 ADA
  NOW() + INTERVAL '30 days',
  'disputed',
  '44444444-4444-4444-4444-444444444444'::uuid
);

-- =====================================================
-- Update projects with freelancers for accepted ones
-- =====================================================

UPDATE projects 
SET freelancer_id = '66666666-6666-6666-6666-666666666666'::uuid,
    accepted_at = NOW() - INTERVAL '5 days'
WHERE title = 'DAO Governance Smart Contracts';

UPDATE projects 
SET freelancer_id = '88888888-8888-8888-8888-888888888888'::uuid,
    accepted_at = NOW() - INTERVAL '3 days'
WHERE title = 'Chainlink Oracle Integration';

-- =====================================================
-- Insert Disputes (5-7 disputed projects)
-- =====================================================

INSERT INTO disputes (
  project_id,
  initiated_by_user_id,
  reason,
  evidence_links,
  state,
  ai_confidence_score,
  ai_reasoning,
  ai_decision_winner,
  ai_completion_percentage
)
SELECT
  p.id,
  p.client_id,
  'Work submitted does not meet success criteria. Multiple components are missing or incomplete.',
  ARRAY['https://github.com/bob_client/escrow-platform/issues/1', 'https://github.com/bob_client/escrow-platform/pull/5'],
  'pending',
  0.78,
  'Analysis of the repository shows that approximately 55% of the required components are implemented. The dispute resolution mechanism is incomplete, and several test cases are failing.',
  'client',
  55
FROM projects p
WHERE p.title = 'Decentralized Escrow Platform'
LIMIT 1;

INSERT INTO disputes (
  project_id,
  initiated_by_user_id,
  reason,
  evidence_links,
  state,
  ai_confidence_score,
  ai_reasoning,
  ai_decision_winner,
  ai_completion_percentage,
  ai_analyzed_at
)
SELECT
  p.id,
  p.client_id,
  'Privacy features not implemented as agreed. Zero-knowledge proof integration is missing.',
  ARRAY['https://github.com/fiona_aiken/voting-system/issues/3'],
  'ai_resolved',
  0.82,
  'Based on commit history and code review, the core voting functionality is complete (85%), but the optional privacy features mentioned in discussions were not implemented. Since they were marked as optional in the success criteria, the work substantially meets requirements.',
  'freelancer',
  85,
  NOW() - INTERVAL '2 days'
FROM projects p
WHERE p.title = 'On-chain Voting System'
LIMIT 1;

INSERT INTO disputes (
  project_id,
  initiated_by_user_id,
  reason,
  evidence_links,
  state,
  ai_confidence_score,
  ai_reasoning,
  ai_decision_winner,
  ai_completion_percentage
)
SELECT
  p.id,
  p.client_id,
  'Liquidation mechanism has critical bugs. Not production-ready as specified.',
  ARRAY['https://github.com/alice_dev/lending-protocol/issues/8', 'https://github.com/alice_dev/lending-protocol/issues/9'],
  'pending',
  0.91,
  'Security audit reveals critical vulnerabilities in the liquidation logic that could result in loss of funds. The code is only 60% complete based on the comprehensive documentation requirement.',
  'client',
  60
FROM projects p
WHERE p.title = 'DeFi Lending Protocol'
LIMIT 1;

INSERT INTO disputes (
  project_id,
  initiated_by_user_id,
  reason,
  evidence_links,
  state,
  ai_confidence_score,
  ai_reasoning,
  ai_decision_winner,
  ai_completion_percentage
)
SELECT
  p.id,
  p.client_id,
  'Payment processing integration is not functional. IPFS uploads are failing intermittently.',
  ARRAY['https://github.com/diana_design/nft-minter/issues/12'],
  'pending',
  0.75,
  'The platform UI and minting logic are well implemented (70% complete), but payment processing and IPFS reliability issues prevent production deployment.',
  'client',
  70
FROM projects p
WHERE p.title = 'No-code NFT Minting Platform'
LIMIT 1;

-- Add 2 more disputes to reach 6 total
INSERT INTO disputes (
  project_id,
  initiated_by_user_id,
  reason,
  evidence_links,
  state,
  ai_confidence_score,
  ai_reasoning,
  redispute_requested,
  redispute_reason,
  redispute_deadline
)
SELECT
  p.id,
  '22222222-2222-2222-2222-222222222222'::uuid,
  'Freelancer claims work is complete but several critical features are missing from the deliverable.',
  ARRAY['https://github.com/bob_client/escrow-platform/compare/main...feature'],
  'pending',
  0.88,
  'Comprehensive code review indicates that the freelancer has completed most of the core functionality but skipped edge case handling and error states.',
  FALSE,
  NULL,
  NULL
FROM projects p
WHERE p.status = 'disputed'
LIMIT 1 OFFSET 0;

-- Extra dispute for variety (human review case)
INSERT INTO disputes (
  project_id,
  initiated_by_user_id,
  arbitrator_id,
  reason,
  evidence_links,
  state,
  ai_confidence_score,
  ai_reasoning,
  ai_decision_winner,
  ai_completion_percentage,
  ai_analyzed_at,
  redispute_requested,
  redispute_deadline,
  arbitrator_decision,
  arbitrator_completion_percentage,
  arbitrator_notes
)
SELECT
  p.id,
  p.client_id,
  '33333333-3333-3333-3333-333333333333'::uuid, -- Charlie as arbitrator
  'Client requested features that were not in original scope. Work delivered matches original specification.',
  ARRAY['https://github.com/fiona_aiken/voting-system/discussions/15'],
  'human_review',
  0.68,
  'The AI has low confidence due to scope ambiguity. The original success criteria are vague about certain implementation details.',
  NULL,
  NULL,
  NOW() - INTERVAL '5 days',
  TRUE,
  NOW() + INTERVAL '2 days',
  'freelancer',
  90,
  'After reviewing all evidence and communication history, the freelancer delivered on the original specification. The additional features were discussed but not formally added to the contract. Recommend 90% completion payment.'
FROM projects p
WHERE p.title = 'On-chain Voting System'
LIMIT 1;

-- =====================================================
-- Create some arbitrators
-- =====================================================
INSERT INTO arbitrators (user_id, is_available, arbitration_score, total_cases_resolved, accuracy_rate)
VALUES 
  ('33333333-3333-3333-3333-333333333333'::uuid, TRUE, 950, 45, 94.50),
  ('99999999-9999-9999-9999-999999999999'::uuid, TRUE, 820, 28, 89.20);

-- =====================================================
-- Note: Auth Users Setup
-- =====================================================
-- To enable login for these users, you need to create them in Supabase Auth.
-- You can do this via Supabase Dashboard or programmatically:
-- 
-- For each user above, create an auth user with:
-- - Email: (as listed above, e.g., alice@example.com)
-- - Password: password123
-- - User ID: (match the UUID used in the users table)
--
-- Example SQL for auth.users (run in Supabase SQL Editor with service role):
-- 
-- INSERT INTO auth.users (
--   id, 
--   instance_id, 
--   email, 
--   encrypted_password,
--   email_confirmed_at,
--   created_at,
--   updated_at,
--   aud,
--   role
-- ) VALUES (
--   '11111111-1111-1111-1111-111111111111',
--   '00000000-0000-0000-0000-000000000000',
--   'alice@example.com',
--   crypt('password123', gen_salt('bf')),
--   NOW(),
--   NOW(),
--   NOW(),
--   'authenticated',
--   'authenticated'
-- );
--
-- Repeat for all 10 users with their respective IDs and emails.
-- OR use Supabase Dashboard: Authentication > Users > Add User (manually for each)
