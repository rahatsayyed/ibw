use cardano/address.{Credential}
use cardano/assets.{PolicyId}
use cardano/certificate.{Certificate}
use cardano/governance.{ProposalProcedure, Voter}
use cardano/script_context.{ScriptContext}
use cardano/transaction.{OutputReference, Transaction}

// easier to find the user-utxo with profile_nft
validator project_contract(profile_nft: PolicyId) {
  // MINTING POLICY VALIDATIONS
  // ===========================
  mint(_redeemer: Data, _policy_id: PolicyId, _self: Transaction) {
    // Project Create
    // --------------
    // 1. Client's Profile NFT MUST be in inputs
    // 2. Extract client_address from Profile UTxO datum
    // 5. Mint exactly ONE Project NFT
    // 6. Project UTxO goes to SCRIPT address (not user wallet)
    // 7. Project UTxO value = project_amount + Project NFT
    // 9. status = Open
    // 8. skipped this part of sending ada to treasury
    // 10. collateral_rate in range [5, 10]
    // 11. minimum_completion_percentage in range [70, 100]
    // 12. completion_deadline > created_at
    // Project Approval
    // ----------------
    // 10. Burn Project NFT
    // No Re-dispute (Finalize)
    // ------------------------
    // 14. Burn Project NFT
    // Human Arbitration
    // -----------------
    // 15. Burn Project NFT
    todo @"mint logic goes here"
  }

  // SPENDING VALIDATOR VALIDATIONS
  // ===============================
  spend(
    _datum: Option<Data>,
    _redeemer: Data,
    _utxo: OutputReference,
    _self: Transaction,
  ) {
    // Project Create
    // --------------
    // 6. Project UTxO MUST return to SCRIPT (after accept/submit/etc)
    // Project Accept
    // --------------
    // 1. status == Open
    // 2. Freelancer's Profile NFT in inputs
    // 3. Project NFT in inputs
    // 5. Project Datum updates:
    //    - freelancer_nft = Some(freelancer_profile_nft)
    //    - status = Accepted
    // 6. Collateral added to Project UTxO value
    // 7. Project UTxO MUST return to SCRIPT
    // 9. Transaction signed by freelancer
    // 12. Ensure project not already accepted
    // Project Submit
    // --------------
    // 1. status == Accepted
    // 2. Project NFT in inputs
    // 3. Freelancer's Profile NFT in inputs
    // 4. datum.freelancer_nft == freelancer's Profile NFT from input
    // 5. Extract freelancer_address from Profile UTxO datum
    // 6. freelancer_address == tx signer
    // 7. Project Datum updates:
    //    - status = Submitted
    //    - submission_details_hash = Some(hash)
    //    - submission_time = Some(current_time)
    // 8. Project UTxO MUST return to SCRIPT
    // 10. current_time <= completion_deadline (not expired)
    // 11. Validate submission_details_hash not empty
    // 12. Check deadline not passed
    // Project Approval
    // ----------------
    // 1. status == Submitted
    // 2. Client's Profile NFT in inputs
    // 3. Project NFT in inputs
    // 4. datum.client_nft == client's Profile NFT
    // 5. Extract client_address from Profile UTxO datum
    // 6. client_address == tx signer
    // 9. Project UTxO consumed (not returned)
    // 11. Full amount sent to freelancer: project_amount + collateral_amount
    // 13. Validate funds go to correct freelancer address
    // 14. Ensure project not already completed/disputed
    // 15. Both Profile NFTs MUST be in inputs
    // Project Dispute
    // ---------------
    // 1. status == Submitted
    // 2. Project NFT in inputs
    // 3. Initiator's Profile NFT in inputs (client OR freelancer)
    // 4. datum.client_nft == initiator NFT OR datum.freelancer_nft == initiator NFT
    // 5. Extract initiator_address from Profile UTxO
    // 6. initiator_address == tx signer
    // 7. Project Datum updates:
    //    - status = Disputed
    //    - dispute_nft = Some(newly_minted_dispute_nft)
    // 10. Project UTxO funds REMAIN LOCKED
    // 11. Project UTxO returns to SCRIPT
    // 15. Check not already disputed
    // No Re-dispute (Finalize)
    // ------------------------
    // 5. Project NFT in inputs
    // 18. Verify no double-spend of project funds
    // Human Arbitration
    // -----------------
    // 3. Project NFT in inputs
    todo @"spend logic goes here"
  }

  else(_ctx: ScriptContext) {
    fail @"invalid handler called"
  }
}
