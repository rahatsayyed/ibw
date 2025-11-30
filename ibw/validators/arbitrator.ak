use aiken/collection/list
use cardano/assets
use cardano/address.{Credential}
use cardano/assets.{PolicyId}
use cardano/certificate.{Certificate}
use cardano/governance.{ProposalProcedure, Voter}
use cardano/script_context.{ScriptContext}
use cardano/transaction.{OutputReference, Transaction}
use functions/dispute/ai_resolve
use functions/dispute/dispute_raise
use functions/dispute/finalize
use functions/dispute/human_resolve
use functions/dispute/re_dispute
use types/types.{
  AIResolve, ArbitratorMintRedeemer, ArbitratorRedeemer, DisputeProject,
  Finalize, HumanArbitration, NoRedispute, ReDispute, ArbitratorResolve,
}

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
    redeemer: ArbitratorRedeemer,
    utxo: OutputReference,
    self: Transaction,
  ) {
    when redeemer is {
      AIResolve ->
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
        ai_resolve.validate_ai_resolve(
          self,
          {
             expect Some(input) = list.find(self.inputs, fn(i) { i.output_reference == utxo })
             let input_assets = input.output.value |> assets.flatten
             expect Some((pid, _, _)) = list.find(input_assets, fn((p, _, _)) { p != assets.ada_policy_id })
             pid
          },
          project_nft,
          profile_nft,
        )

      ReDispute ->
        // Re-dispute
        // ----------
        // 1. state == AIResolved -> HumanReview
        // 2. current_time <= re_dispute_deadline
        // 3. re_dispute_requested == True
        // 4. re_dispute_reason_hash is Some
        re_dispute.validate_re_dispute(
          self,
          {
             expect Some(input) = list.find(self.inputs, fn(i) { i.output_reference == utxo })
             let input_assets = input.output.value |> assets.flatten
             expect Some((pid, _, _)) = list.find(input_assets, fn((p, _, _)) { p != assets.ada_policy_id })
             pid
          },
          project_nft,
          profile_nft,
        )
      Finalize ->
        // Finalize
        // --------
        // 1. state == AIResolved
        // 2. current_time > re_dispute_deadline
        // 3. re_dispute_requested == False
        // 4. Dispute NFT in inputs
        // 5. Dispute NFT burned (not in outputs)
        finalize.validate_finalize(
          self,
          {
             expect Some(input) = list.find(self.inputs, fn(i) { i.output_reference == utxo })
             let input_assets = input.output.value |> assets.flatten
             expect Some((pid, _, _)) = list.find(input_assets, fn((p, _, _)) { p != assets.ada_policy_id })
             pid
          },
          project_nft,
          profile_nft,
        )
      ArbitratorResolve ->
        // Human Resolve
        // -------------
        // 1. state == HumanReview
        // 2. Signed by Arbitrator
        // 3. Dispute NFT burned
        human_resolve.validate_human_resolve(
          self,
          {
             expect Some(input) = list.find(self.inputs, fn(i) { i.output_reference == utxo })
             let input_assets = input.output.value |> assets.flatten
             expect Some((pid, _, _)) = list.find(input_assets, fn((p, _, _)) { p != assets.ada_policy_id })
             pid
          },
          project_nft,
          profile_nft,
        )
    }
  }

  else(_ctx: ScriptContext) {
    fail @"invalid handler called"
  }
}
