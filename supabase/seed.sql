-- =====================================================
-- Clear Existing Data (EXCEPT USERS)
-- =====================================================
TRUNCATE TABLE notifications CASCADE;
TRUNCATE TABLE project_history CASCADE;
TRUNCATE TABLE project_submissions CASCADE;
TRUNCATE TABLE disputes CASCADE;
TRUNCATE TABLE projects CASCADE;
TRUNCATE TABLE arbitrators CASCADE;
-- TRUNCATE TABLE users CASCADE; -- Preserving existing users

-- =====================================================
-- Insert Mock Projects (20-25 projects with variety)
-- =====================================================

-- We will cycle through the first 3 users for client_id
-- User 1: (SELECT id FROM users ORDER BY created_at ASC LIMIT 1 OFFSET 0)
-- User 2: (SELECT id FROM users ORDER BY created_at ASC LIMIT 1 OFFSET 1)
-- User 3: (SELECT id FROM users ORDER BY created_at ASC LIMIT 1 OFFSET 2)

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
-- Project 1: DeFi Dashboard (Open) - User 2
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
  (SELECT id FROM users ORDER BY created_at ASC LIMIT 1 OFFSET 1)
),
-- Project 2: Smart Contract Audit (Open) - User 2
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
  (SELECT id FROM users ORDER BY created_at ASC LIMIT 1 OFFSET 1)
),
-- Project 3: NFT Marketplace Backend (Open) - User 1
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
  (SELECT id FROM users ORDER BY created_at ASC LIMIT 1 OFFSET 0)
),
-- Project 4: Mobile Wallet App (Open) - User 1 (Recycled)
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
  (SELECT id FROM users ORDER BY created_at ASC LIMIT 1 OFFSET 0)
),
-- Project 5: DEX Integration (Open) - User 2 (Recycled)
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
  (SELECT id FROM users ORDER BY created_at ASC LIMIT 1 OFFSET 1)
),
-- Project 6: DAO Governance Platform (Accepted) - User 1
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
  (SELECT id FROM users ORDER BY created_at ASC LIMIT 1 OFFSET 0)
),
-- Project 7: CI/CD Pipeline Setup (Open) - User 3
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
  (SELECT id FROM users ORDER BY created_at ASC LIMIT 1 OFFSET 2)
),
-- Project 8: Staking Pool Dashboard (Open) - User 3 (Recycled)
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
  (SELECT id FROM users ORDER BY created_at ASC LIMIT 1 OFFSET 2)
),
-- Project 9: Automated Testing Suite (Open) - User 3 (Recycled)
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
  (SELECT id FROM users ORDER BY created_at ASC LIMIT 1 OFFSET 2)
),
-- Project 10: Blockchain Analytics (Open) - User 1 (Recycled)
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
  (SELECT id FROM users ORDER BY created_at ASC LIMIT 1 OFFSET 0)
),
-- Project 11: Token Vesting Contract (Open) - User 3 (Recycled)
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
  (SELECT id FROM users ORDER BY created_at ASC LIMIT 1 OFFSET 2)
),
-- Project 12: Multi-sig Wallet (Open) - User 1
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
  (SELECT id FROM users ORDER BY created_at ASC LIMIT 1 OFFSET 0)
),
-- Project 13: Oracle Integration (Accepted) - User 2 (Recycled)
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
  (SELECT id FROM users ORDER BY created_at ASC LIMIT 1 OFFSET 1)
),
-- Project 14: Game Asset Marketplace (Open) - User 3 (Recycled)
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
  (SELECT id FROM users ORDER BY created_at ASC LIMIT 1 OFFSET 2)
),
-- Project 15: Documentation Website (Open) - User 2
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
  (SELECT id FROM users ORDER BY created_at ASC LIMIT 1 OFFSET 1)
),
-- Project 16: Social Recovery Wallet (Open) - User 3 (Recycled)
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
  (SELECT id FROM users ORDER BY created_at ASC LIMIT 1 OFFSET 2)
),
-- Project 17: Liquidity Pool Frontend (Open) - User 1 (Recycled)
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
  (SELECT id FROM users ORDER BY created_at ASC LIMIT 1 OFFSET 0)
),
-- Project 18: Metadata Server (Open) - User 2 (Recycled)
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
  (SELECT id FROM users ORDER BY created_at ASC LIMIT 1 OFFSET 1)
),
-- Project 19: Security Scanner (Open) - User 3
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
  (SELECT id FROM users ORDER BY created_at ASC LIMIT 1 OFFSET 2)
),
-- Project 20: Token Launchpad (Open) - User 1
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
  (SELECT id FROM users ORDER BY created_at ASC LIMIT 1 OFFSET 0)
),
-- Project 21: Portfolio Tracker (Open) - User 3 (Recycled)
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
  (SELECT id FROM users ORDER BY created_at ASC LIMIT 1 OFFSET 2)
),
-- Project 22: Escrow Service (Disputed) - User 2
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
  (SELECT id FROM users ORDER BY created_at ASC LIMIT 1 OFFSET 1)
),
-- Project 23: Voting System (Disputed) - User 3 (Recycled)
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
  (SELECT id FROM users ORDER BY created_at ASC LIMIT 1 OFFSET 2)
),
-- Project 24: Lending Protocol (Disputed) - User 1
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
  (SELECT id FROM users ORDER BY created_at ASC LIMIT 1 OFFSET 0)
),
-- Project 25: NFT Minting Platform (Disputed) - User 1 (Recycled)
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
  (SELECT id FROM users ORDER BY created_at ASC LIMIT 1 OFFSET 0)
);

-- =====================================================
-- Update projects with freelancers for accepted ones
-- =====================================================

UPDATE projects 
SET freelancer_id = (SELECT id FROM users ORDER BY created_at ASC LIMIT 1 OFFSET 2), -- User 3
    accepted_at = NOW() - INTERVAL '5 days'
WHERE title = 'DAO Governance Smart Contracts';

UPDATE projects 
SET freelancer_id = (SELECT id FROM users ORDER BY created_at ASC LIMIT 1 OFFSET 2), -- User 3 (Recycled)
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
  (SELECT id FROM users ORDER BY created_at ASC LIMIT 1 OFFSET 1), -- User 2
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
  (SELECT id FROM users ORDER BY created_at ASC LIMIT 1 OFFSET 2), -- User 3 as arbitrator
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
  ((SELECT id FROM users ORDER BY created_at ASC LIMIT 1 OFFSET 2), TRUE, 950, 45, 94.50), -- User 3
  ((SELECT id FROM users ORDER BY created_at ASC LIMIT 1 OFFSET 0), TRUE, 820, 28, 89.20); -- User 1
