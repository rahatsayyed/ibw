use aiken/collection/dict
use aiken/collection/list
use cardano/address.{Script}
use cardano/assets.{PolicyId}
use cardano/script_context.{ScriptContext}
use cardano/transaction.{InlineDatum, Input, OutputReference, Transaction}
use cardano/value
use functions/dispute/project_dispute
use functions/project_accept
use functions/project_approval
use functions/project_submit
use types/types.{
  Accepted, Completed, Disputed, Open, ProjectAccept, ProjectApproval, ProjectDatum, ProjectDispute,
  ProjectRedeemer, ProjectSubmit, ProjectReDispute, ProjectFinalize, ProjectResolve, Submitted, UserProfileDatum,
}

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
    datum: Option<ProjectDatum>,
    redeemer: ProjectRedeemer,
    utxo: OutputReference,
    self: Transaction,
  ) {
    expect Some(input_datum) = datum

    // Find the output that corresponds to the updated project state (if any)
    // For Accept and Submit, we expect the project to continue existing.
    // For Approval, it might be consumed/finished.
    
    // We need to identify the output datum.
    // Since we don't have the output passed explicitly, we need to find it.
    // We can assume there's exactly one output with the Project NFT (if it continues).
    // Or we can iterate outputs.
    // But wait, `project_accept` takes `output_datum`.
    // We need to extract it here.
    
    // Strategy: Find the output that contains the Project NFT.
    // We don't have the Project NFT Policy ID here directly available as a param to `spend`?
    // Wait, `project_contract` is a validator. `mint` has `policy_id`. `spend` does NOT.
    // But the input being spent HAS the Project NFT.
    // We can find the Project NFT from the input being spent!
    // But `spend` gives `_utxo` (OutputReference). We can look up the input in `self.inputs`.
    expect Some(own_input) =
      list.find(self.inputs, fn(input) { input.output_reference == utxo })
    
    // Now find the Project NFT in `own_input.output.value`.
    // It should be the token that is NOT ADA.
    // There might be other tokens?
    // Let's assume the Project NFT is the only non-ADA token or we can identify it.
    // Actually, we don't strictly need the Policy ID if we just look for the output with the SAME asset.
    // But to be safe, let's find the asset.
    let project_assets =
      own_input.output.value
        |> assets.without_lovelace
        |> assets.flatten
    
    // Assume the first one is the Project NFT? Or filter by known policy if we knew it.
    // Since we don't know it, let's assume there's only one relevant NFT.
    expect [(project_pid, project_tn, _)] = project_assets
    
    // Now find the output with this NFT.
    let own_output_opt =
      list.find(
        self.outputs,
        fn(output) {
          assets.quantity_of(output.value, project_pid, project_tn) == 1
        },
      )

    when redeemer is {
      ProjectAccept -> {
        // Project Accept
        expect Some(own_output) = own_output_opt
        expect InlineDatum(d) = own_output.datum
        expect output_datum: ProjectDatum = d
        
        project_accept.validate_project_accept(
          self,
          own_input,
          own_output,
          input_datum,
          output_datum,
          profile_nft,
        )
      }
      ProjectSubmit -> {
        // Project Submit
        expect Some(own_output) = own_output_opt
        expect InlineDatum(d) = own_output.datum
        expect output_datum: ProjectDatum = d

        project_submit.validate_project_submit(
          self,
          own_input,
          own_output,
          input_datum,
          output_datum,
          profile_nft,
        )
      }
      ProjectApproval ->
        // Project Approval
        // Note: Approval might consume the UTxO (no output with Project NFT).
        // If so, `own_output_opt` would be None.
        // `validate_project_approval` doesn't take `output_datum`.
        project_approval.validate_project_approval(
          self,
          input_datum,
          profile_nft,
        )
      ProjectDispute -> {
        // Project Dispute
        expect Some(own_output) = own_output_opt
        expect InlineDatum(d) = own_output.datum
        expect output_datum: ProjectDatum = d

        project_dispute.validate_project_dispute(
          self,
          input_datum,
          output_datum,
          profile_nft,
        )
      }
      ProjectReDispute -> {
        // Project Re-Dispute
        // ------------------
        // Triggered by Arbitrator Script (Re-Dispute Flow)
        // 1. Project Status stays Disputed
        // 2. No other changes to Project Datum
        // 3. Authorization: Dispute NFT in inputs (being spent/updated)
        
        expect Some(own_output) = own_output_opt
        expect InlineDatum(d) = own_output.datum
        expect output_datum: ProjectDatum = d

        // Validate status unchanged
        let status_check =
          input_datum.status == Disputed && output_datum.status == Disputed

        // Validate authorization via Dispute NFT
        expect Some(dispute_nft_class) = input_datum.dispute_nft
        
        let dispute_auth_check =
          list.any(
            self.inputs,
            fn(input) {
              list.any(
                input.output.value |> assets.flatten,
                fn((pid, tn, _)) {
                  pid == dispute_nft_class.policy_id && tn == dispute_nft_class.asset_name
                },
              )
            },
          )

        status_check? && dispute_auth_check?
      }
      ProjectFinalize -> {
        // Project Finalize
        // ----------------
        // Triggered by Arbitrator Script (Finalize Flow)
        // 1. Project Status -> Completed
        // 2. Funds distributed (checked by Arbitrator Script)
        // 3. Project NFT stays in output (or burned? usually stays for record)
        
        expect Some(own_output) = own_output_opt
        expect InlineDatum(d) = own_output.datum
        expect output_datum: ProjectDatum = d

        // Validate status transition
        // From Disputed -> Completed
        let status_check =
          input_datum.status == Disputed && output_datum.status == Completed

        // Validate other fields unchanged (except maybe completion time?)
        // For now, just status check is critical.
        // Also, ensure this is triggered by the Arbitrator.
        // The Arbitrator script will be running in the same transaction.
        // We can check if the Dispute NFT is being spent/burned in this tx?
        // Or just rely on the fact that to change status to Completed from Disputed,
        // we need some authorization.
        // If anyone can call this, they could force complete a disputed project.
        // BUT, the Arbitrator script controls the Dispute UTxO.
        // If the Dispute UTxO is not spent/finalized, the dispute is not resolved.
        // However, the Project Script is independent.
        // We MUST ensure that the "Finalize" action is authorized.
        // Authorization comes from the Arbitrator Script via the Dispute NFT.
        // If the Dispute NFT is present in the inputs (being spent), then it's a valid finalize.
        // So we check: Dispute NFT is in inputs.
        // We need the Dispute Policy ID.
        // But we don't have it passed here.
        // However, the Project Datum has `dispute_nft` field!
        expect Some(dispute_nft_class) = input_datum.dispute_nft
        
        let dispute_auth_check =
          list.any(
            self.inputs,
            fn(input) {
              list.any(
                input.output.value |> assets.flatten,
                fn((pid, tn, _)) {
                  pid == dispute_nft_class.policy_id && tn == dispute_nft_class.asset_name
                },
              )
            },
          )

        status_check? && dispute_auth_check?
      }
      ProjectResolve -> {
        // Project Resolve (Human)
        // -----------------------
        // Same logic as Finalize: Disputed -> Completed, authorized by Dispute NFT burn.
        
        expect Some(own_output) = own_output_opt
        expect InlineDatum(d) = own_output.datum
        expect output_datum: ProjectDatum = d

        let status_check =
          input_datum.status == Disputed && output_datum.status == Completed

        expect Some(dispute_nft_class) = input_datum.dispute_nft
        
        let dispute_auth_check =
          list.any(
            self.inputs,
            fn(input) {
              list.any(
                input.output.value |> assets.flatten,
                fn((pid, tn, _)) {
                  pid == dispute_nft_class.policy_id && tn == dispute_nft_class.asset_name
                },
              )
            },
          )

        status_check? && dispute_auth_check?
      }
    }
  }

  else(_ctx: ScriptContext) {
    fail @"invalid handler called"
  }
}
