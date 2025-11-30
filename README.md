# Verico (IBW Hackathon Submission)

**Deployment:** [ibw.vercel.app](https://ibw.vercel.app)

## Overview

**Verico** is a decentralized freelance and project management platform built for the **India Blockchain Week (IBW) Hackathon**. It leverages the Cardano blockchain to create a trustless environment where clients and freelancers can collaborate securely. The platform integrates advanced features like AI-driven dispute resolution and a robust staking/slashing mechanism to ensure fair play.

## Key Features

-   **Decentralized Project Management:** Create, manage, and track projects with full transparency on the blockchain.
-   **Secure Escrow:** Funds are locked in smart contracts upon project acceptance, ensuring payment security for freelancers and delivery assurance for clients.
-   **Hybrid Dispute Resolution (AI + Human):**
    -   **AI Arbitration:** An AI agent analyzes project data (chats, commits, milestones) to resolve straightforward disputes quickly and impartially.
    -   **Human Arbitration:** For complex or contested cases, a panel of decentralized human arbitrators reviews the evidence.
-   **Staking & Slashing Mechanism:**
    -   **Staking:** Arbitrators must stake tokens to join the dispute resolution panel. This "skin in the game" ensures they are incentivized to act honestly and diligently.
    -   **Slashing:** If an arbitrator is found to be acting maliciously or consistently votes against the consensus in a way that suggests collusion, a portion of their stake is "slashed" (forfeited). This economic penalty deters bad actors and maintains the integrity of the arbitration process.
-   **Freelancer Profiles:** On-chain identity and reputation management for freelancers.
-   **Seamless Wallet Integration:** Connect with Cardano wallets (e.g., Eternl, Nami) for secure transactions.
-   **Transaction Chaining:** Optimized user experience with chained transactions for deposit and action flows (e.g., "Deposit & Accept").

## Technology Stack

-   **Frontend:** Next.js 15, React 18, TypeScript
-   **UI Components:** HeroUI, Tailwind CSS, Framer Motion
-   **Blockchain Interaction:** Lucid Evolution
-   **Smart Contracts:** Aiken (Plutus V3)
-   **Database:** Supabase (PostgreSQL)
-   **Styling:** Tailwind CSS with custom animations

## How It Works

1.  **Create Profile:** Users mint a unique User Profile NFT to establish their identity on the platform.
2.  **Post a Project:** Clients create projects with detailed requirements, budget, and deadlines.
3.  **Accept & Escrow:** Freelancers accept projects. Clients deposit funds into a secure smart contract escrow.
4.  **Submit Work:** Freelancers submit their deliverables on-chain.
5.  **Review & Complete:** Clients review the work. If satisfied, funds are released.
6.  **Dispute Resolution:** In case of disagreement, either party can raise a dispute. The system routes it to AI or Human arbitration based on complexity and user choice.

## Getting Started

### Prerequisites

-   Node.js (v18+)
-   npm or yarn
-   A Cardano wallet (e.g., Eternl, Nami) connected to the Preprod testnet.

### Installation

1.  Clone the repository:
    ```bash
    git clone https://github.com/rahatsayyed/ibw.git
    cd ibw/web
    ```

2.  Install dependencies:
    ```bash
    npm install
    ```

3.  Set up environment variables:
    Create a `.env.local` file in the `web` directory and add your keys:
    ```env
    NEXT_PUBLIC_BF_URL=https://cardano-preprod.blockfrost.io/api/v0
    NEXT_PUBLIC_BF_PID=your_blockfrost_project_id
    NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
    NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
    NEXT_PUBLIC_CARDANO_NETWORK=Preprod
    ```

4.  Run the development server:
    ```bash
    npm run dev
    ```

5.  Open [http://localhost:3000](http://localhost:3000) in your browser.

## Smart Contracts

The smart contracts are written in **Aiken** and located in the `ibw` directory. They handle:
-   **User Profile:** Minting and updating user identities.
-   **Project Contract:** Managing project lifecycle (Creation, Escrow, Completion).
-   **Arbitrator:** Logic for dispute resolution flows.

To build contracts:
```bash
cd ibw
aiken build
```
