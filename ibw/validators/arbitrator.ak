use cardano/address.{Credential}
use cardano/assets.{PolicyId}
use cardano/certificate.{Certificate}
use cardano/governance.{ProposalProcedure, Voter}
use cardano/script_context.{ScriptContext}
use cardano/transaction.{OutputReference, Transaction}
use functions/dispute/dispute_raise
use types/types.{ArbitratorMintRedeemer, DisputeProject, HumanArbitration, NoRedispute}

// easier to find the user-utxo with profile_nft and project_utxo with project_nft
validator arbitrator(profile_nft: PolicyId, project_nft: PolicyId) {
  // MINTING POLICY VALIDATIONS
  // ===========================
  
  mint(redeemer: ArbitratorMintRedeemer, policy_id: PolicyId, self: Transaction) {
    when redeemer is {
      DisputeProject ->
        // Project Dispute
        // ---------------
        // 8. Create Dispute UTxO with DisputeDatum
        // 9. Mint exactly ONE Dispute NFT
        // 14. Validate dispute reason not empty
        dispute_raise.validate_dispute_raise(
          self,
          policy_id,
          project_nft,
          profile_nft,
        )
      NoRedispute ->
        // No Re-dispute (Finalize)
        // ------------------------
        // 13. Burn Dispute NFT
        todo @"burn logic"
      HumanArbitration ->
        // Human Arbitration
        // -----------------
        // 14. Burn Dispute NFT
        todo @"burn logic"
    }
  }

  // SPENDING VALIDATOR VALIDATIONS
  // ===============================
  
  spend(
    _datum: Option<Data>,
    _redeemer: Data,
    _utxo: OutputReference,
    _self: Transaction,
  ) {
    // Project Dispute
    // ---------------
    // 12. Dispute UTxO goes to DISPUTE SCRIPT
    // 16. Ensure within dispute window (e.g., 14 days after submission)
    
    // AI Dispute Resolution
    // ---------------------
    // 1. state == Pending
    // 2. Dispute NFT in inputs
    // 3. Transaction signed by authorized AI agent
    // 4. Verify AI agent signature OR Masumi registry
    // 5. Datum updates:
    //    - ai_agent_id = Some(agent_id)
    //    - ai_decision = Some(Client/Freelancer)
    //    - completion_percentage = Some(0-100)
    //    - ai_confidence = Some(0-100)
    //    - ai_analysis_hash = Some(hash)
    //    - re_dispute_deadline = Some(current_time + 7 days)
    //    - state = AIResolved
    // 6. Dispute UTxO returns to DISPUTE SCRIPT
    // 7. Dispute NFT returned
    // 8. AI agent payment sent (from dispute fee pool)
    // 9. Validate completion_percentage in [0, 100]
    // 10. Validate ai_confidence in [0, 100]
    // 11. Ensure AI agent is registered on Masumi
    // 12. Verify AI payment transaction hash
    
    // No Re-dispute (Finalize)
    // ------------------------
    // 1. state == AIResolved
    // 2. current_time > re_dispute_deadline
    // 3. re_dispute_requested == False
    // 4. Dispute NFT in inputs
    // 6. Both Profile NFTs in inputs (client + freelancer)
    // 7. Calculate distribution based on ai_decision & completion_percentage:
    //    IF completion_percentage >= minimum_completion_percentage:
    //      freelancer_gets = project_amount + collateral_amount
    //      client_gets = 0
    //    ELSE:
    //      freelancer_gets = (project_amount * completion_percentage / 100) + collateral_amount
    //      client_gets = project_amount * (100 - completion_percentage) / 100
    // 8. Identify faulty party (dispute initiator if they lost)
    // 9. Calculate penalties from faulty party:
    //    - AI cost (e.g., 5 ADA)
    //    - Fraud penalty (10% of their locked amount)
    // 12. Distribute funds:
    //     - Winner's wallet: calculated amount
    //     - Platform treasury: fraud penalty
    //     - AI agent: dispute cost (if not already paid)
    // 16. Validate winner actually receives correct amount
    // 19. Check fraud penalty calculation correct
    // 20. Validate both UTxOs consumed properly
    
    // Re-dispute
    // ----------
    // 1. state == AIResolved
    // 2. current_time <= re_dispute_deadline
    // 3. re_dispute_requested == False
    // 4. Dispute NFT in inputs
    // 5. Initiator is the LOSING party:
    //    - If ai_decision == Client, then freelancer can re-dispute
    //    - If ai_decision == Freelancer, then client can re-dispute
    // 6. Initiator's Profile NFT in inputs
    // 7. datum.client_nft == initiator NFT OR datum.freelancer_nft == initiator NFT
    // 8. initiator_address == tx signer
    // 9. Datum updates:
    //    - re_dispute_requested = True
    //    - re_dispute_reason_hash = Some(hash)
    //    - state = HumanReview
    //    - arbitrator_nft = Some(selected_arbitrator_nft)
    // 10. Dispute UTxO returns to SCRIPT
    // 11. Dispute NFT returned
    // 13. Validate re-dispute reason not empty
    // 14. Ensure only losing party can re-dispute
    // 15. Verify arbitrator eligibility (off-chain verified, on-chain confirmed)
    
    // Human Arbitration
    // -----------------
    // 1. state == HumanReview
    // 2. Dispute NFT in inputs
    // 4. All 3 Profile NFTs in inputs: client, freelancer, arbitrator
    // 5. datum.arbitrator_nft == arbitrator's Profile NFT
    // 6. Extract arbitrator_address from Profile UTxO
    // 7. arbitrator_address == tx signer
    // 9. Datum updates:
    //    - final_decision = Some(Client/Freelancer/Partial)
    //    - final_completion_percentage = Some(0-100) (if partial)
    //    - state = Resolved
    //    - resolved_at = Some(current_time)
    // 10. Calculate distribution (same as AI finalization)
    // 11. Arbitrator compensation from loser's penalty:
    //     - Fixed fee based on project size (10-50 ADA)
    // 13. Distribute funds:
    //     - Winner: calculated amount
    //     - Arbitrator: fee
    //     - Platform: fraud penalty
    // 17. Validate arbitrator is actually assigned (not random person)
    // 18. Ensure arbitrator fee doesn't exceed loser's penalty
    // 19. Handle case where loser has insufficient funds
    // 20. Prevent arbitrator from deciding if they're a party in dispute
    // 21. Validate final decision is valid (not None)
    
    todo @"spend logic goes here"
  }

  else(_ctx: ScriptContext) {
    fail @"invalid handler called"
  }
}
