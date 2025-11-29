use aiken/collection/dict
use aiken/collection/list
use cardano/address.{Script}
use cardano/assets.{PolicyId}
use cardano/script_context.{ScriptContext}
use cardano/transaction.{InlineDatum, Input, OutputReference, Transaction}
use cardano/value
use types/types.{Open, ProjectDatum, UserProfileDatum}

pub type ProjectMintRedeemer {
  Create
  Burn
}

// easier to find the user-utxo with profile_nft
validator project_contract(profile_nft: PolicyId) {
  // MINTING POLICY VALIDATIONS
  // ===========================
  mint(redeemer: ProjectMintRedeemer, policy_id: PolicyId, self: Transaction) {
    when redeemer is {
      Create -> {
        // Project Create
        // --------------
        // 1. Client's Profile NFT MUST be in inputs
        expect Some(client_input) =
          list.find(
            self.inputs,
            fn(input) {
              list.any(
                input.output.value |> assets.flatten,
                fn((pid, _, _)) { pid == profile_nft },
              )
            },
          )

        // 2. Extract client_address from Profile UTxO datum
        expect InlineDatum(datum_data) = client_input.output.datum
        expect client_datum: UserProfileDatum = datum_data

        // 5. Mint exactly ONE Project NFT
        // Use the output reference of the first input as the token name for uniqueness,
        // or just check that we are minting exactly one token of this policy.
        // The requirement says "Mint exactly ONE Project NFT".
        // We need to find the output that has this token to validate it.
        expect Some(project_output) =
          list.find(
            self.outputs,
            fn(output) {
              list.any(
                output.value |> assets.flatten,
                fn((pid, _, _)) { pid == policy_id },
              )
            },
          )

        // Verify minting quantity is 1
        expect [Pair(_, 1)] =
          self.mint
            |> assets.tokens(policy_id)
            |> dict.to_pairs

        // 6. Project UTxO goes to SCRIPT address (not user wallet)
        expect Script(_) = project_output.address.payment_credential

        // 7. Project UTxO value = project_amount + Project NFT
        expect InlineDatum(project_datum_data) = project_output.datum
        expect project_datum: ProjectDatum = project_datum_data

        // Check value: project_amount + min_ada (implicitly handled by ledger, but we should check project_amount is there)
        // Actually, we should check that the output value contains at least project_amount.
        // And the Project NFT.
        let value_check =
          (
            project_output.value
              |> assets.lovelace_of
          ) >= project_datum.project_amount

        // 9. status = Open
        let status_check = project_datum.status == Open

        // 10. collateral_rate in range [5, 10]
        let collateral_check =
          project_datum.collateral_rate >= 5 && project_datum.collateral_rate <= 10

        // 11. minimum_completion_percentage in range [70, 100]
        let completion_check =
          project_datum.minimum_completion_percentage >= 70 && project_datum.minimum_completion_percentage <= 100

        // 12. completion_deadline > created_at
        let deadline_check =
          project_datum.completion_deadline.start > project_datum.created_at.end

        // Verify client address matches signer (implicit in UserProfile logic, but good to check)
        // 2. Extract client_address from Profile UTxO datum
        // We already got client_datum.
        // We should check that the transaction is signed by the user in the profile datum.
        let signer_check =
          list.has(self.extra_signatories, client_datum.user_address.pkh)

        value_check? && status_check? && collateral_check? && completion_check? && deadline_check? && signer_check?
      }
      Burn -> todo @"burn logic"
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
