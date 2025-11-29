use aiken/collection/list
use cardano/address.{Script}
use cardano/assets.{PolicyId}
use cardano/script_context.{ScriptContext}
use cardano/transaction.{InlineDatum, OutputReference, Transaction, find_input}
use functions/deposit
use functions/project_accept_profile
use functions/project_approval_profile
use functions/project_create
use functions/project_submit_profile
use functions/user_registration
use functions/withdraw
use types/types.{ProjectDatum, UserProfileDatum}

// Redeemer for spend operations
pub type UserProfileRedeemer {
  Deposit { amount: Int }
  Withdraw { amount: Int }
  ProjectCreate
  ProjectAccept
  ProjectSubmit
  ProjectApproval
}

validator user_profile {
  // MINTING POLICY VALIDATIONS
  // ===========================
  mint(redeemer: ByteArray, policy_id: PolicyId, tx: Transaction) {
    // User Registration
    // -----------------
    // 1. Mint unique Profile NFT (one per address)
    // 2. user_address matches transaction signer
    // 3. All counters start at 0
    // Use the redeemer (username) directly as the token name
    let token_name = redeemer
    // Validate user registration using the dedicated function
    user_registration.validate_user_registration(tx, policy_id, token_name)
  }

  // SPENDING VALIDATOR VALIDATIONS
  // ===============================
  spend(
    datum: Option<UserProfileDatum>,
    redeemer: UserProfileRedeemer,
    utxo: OutputReference,
    tx: Transaction,
  ) {
    expect Some(input_datum) = datum
    expect Some(input) = find_input(tx.inputs, utxo)
    expect Script(_script_hash) = input.output.address.payment_credential
    // Get script address for NFT verification
    let script_address = input.output.address
    // Get profile NFT info from datum
    let profile_nft_policy = input_datum.profile_nft.policy_id
    let profile_nft_name = input_datum.profile_nft.asset_name
    // Find output with the Profile NFT to get output datum
    let output_datum_data =
      user_registration.find_output_with_nft(
        tx.outputs,
        profile_nft_policy,
        profile_nft_name,
      )
    expect output_datum: UserProfileDatum = output_datum_data
    when redeemer is {
      Deposit { amount } ->
        // Deposit
        // -------
        // 1. Input UTxO contains Profile NFT
        // 2. datum.user_address == tx signer
        // 3. output.total_balance = input.total_balance + deposit_amount
        // 4. output.available_balance = input.available_balance + deposit_amount
        // 5. Profile NFT returned to same address
        // 6. All other fields unchanged
        deposit.validate_deposit(
          tx,
          input_datum,
          output_datum,
          amount,
          profile_nft_policy,
          profile_nft_name,
          script_address,
        )
      Withdraw { amount } ->
        // Withdraw
        // --------
        // 1. datum.user_address == tx signer
        // 2. Profile NFT in input/output
        // 3. withdrawal_amount <= available_balance
        // 4. output.total_balance = input.total_balance - withdrawal_amount
        // 5. output.available_balance = input.available_balance - withdrawal_amount
        // 6. withdrawal_amount sent to user's wallet
        // 7. All other fields unchanged
        withdraw.validate_withdrawal(
          tx,
          input_datum,
          output_datum,
          amount,
          profile_nft_policy,
          profile_nft_name,
          script_address,
        )
      ProjectCreate ->
        // Project Create
        // --------------
        // 3. Verify client Profile UTxO updates:
        //    - active_projects_as_client += 1
        //    - project_collateral += 25_000_000
        //    - total_balance unchanged (or +25 if shortfall)
        // 4. Client Profile NFT returned to client
        // 13. Validate project_collateral calculation (25 ADA * active_projects)
        // 14. Ensure client has sufficient balance
        project_create.validate_project_creation(
          tx,
          input_datum,
          output_datum,
          profile_nft_policy,
          profile_nft_name,
          script_address,
        )
      ProjectAccept ->
        // Project Accept (Freelancer)
        // ----------------------------
        // Freelancer Profile UTxO updates:
        // - active_projects_as_freelancer += 1
        // - Profile NFT returned to same address
        // - Output lovelace matches total_balance
        project_accept_profile.validate_freelancer_accept_profile(
          tx,
          input_datum,
          output_datum,
          profile_nft_policy,
          profile_nft_name,
          script_address,
        )
      ProjectSubmit ->
        // Project Submit (Freelancer)
        // ----------------------------
        // Freelancer Profile unchanged
        // - All fields remain the same
        // - Profile NFT returned to same address
        project_submit_profile.validate_freelancer_submit_profile(
          tx,
          input_datum,
          output_datum,
          profile_nft_policy,
          profile_nft_name,
          script_address,
        )
      ProjectApproval -> {
        // Project Approval
        // -----------------
        // Client approves, both profiles updated
        // Determine if this is client or freelancer by checking profile NFT against project datum
        
        // Find the project input being consumed
        let project_input_opt =
          list.find(
            tx.inputs,
            fn(input) {
              when input.output.datum is {
                InlineDatum(_) -> True
                _ -> False
              }
            },
          )

        expect Some(project_input) = project_input_opt
        expect InlineDatum(d) = project_input.output.datum
        expect project_datum: ProjectDatum = d

        // Check if this profile is the client by comparing NFTs
        let is_client_profile = input_datum.profile_nft == project_datum.client_nft

        if is_client_profile {
          // Client Profile updates
          project_approval_profile.validate_client_approval_profile(
            tx,
            input_datum,
            output_datum,
            profile_nft_policy,
            profile_nft_name,
            script_address,
          )
        } else {
          // Freelancer Profile updates
          project_approval_profile.validate_freelancer_approval_profile(
            tx,
            input_datum,
            output_datum,
            project_datum.project_amount,
            profile_nft_policy,
            profile_nft_name,
            script_address,
          )
        }
      }
    }
    // Project Accept
    // --------------
    // 4. Freelancer Profile UTxO updates:
    //    - active_projects_as_freelancer += 1
    //    - project_collateral += (project_amount * collateral_rate / 100)
    //    - total_balance unchanged (or +collateral if shortfall)
    // 8. Profile NFTs returned to respective owners
    // 10. Validate freelancer has enough balance for collateral
    // 11. Check freelancer's reputation (optional: minimum threshold) {SKIP for now and make comment}
    // Project Submit
    // --------------
    // 9. Freelancer Profile NFT returned unchanged
    // Project Approval
    // ----------------
    // 7. Client Profile UTxO updates:
    //    - active_projects_as_client -= 1
    //    - project_collateral -= 25_000_000
    //    - total_client_completed += 1
    //    - reputation_score += 5
    // 8. Freelancer Profile UTxO updates:
    //    - active_projects_as_freelancer -= 1
    //    - project_collateral -= collateral_amount
    //    - available_balance += (project_amount + collateral_amount)
    //    - total_freelancer_completed += 1
    //    - reputation_score += 10
    // 12. Both Profile NFTs returned to owners
    // Project Dispute
    // ---------------
    // 13. All Profile NFTs returned unchanged
    // No Re-dispute (Finalize)
    // ------------------------
    // 10. Winner Profile UTxO updates:
    //     - active_projects -= 1
    //     - project_collateral -= locked_amount
    //     - available_balance += winnings
    //     - total_completed += 1
    //     - reputation_score += 20
    // 11. Loser Profile UTxO updates:
    //     - active_projects -= 1
    //     - project_collateral -= (locked_amount + penalties)
    //     - total_disputed += 1
    //     - fraud_count += 1 (if fraudulent dispute)
    //     - reputation_score -= 50
    // 15. Both Profile NFTs returned
    // 17. Ensure loser has sufficient balance for penalties
    // Re-dispute
    // ----------
    // 12. Profile NFTs returned
    // Human Arbitration
    // -----------------
    // 8. Verify arbitrator eligibility:
    //    - reputation_score >= 500
    //    - arbitration_score >= 80
    //    - total_balance >= 100 ADA
    // 12. Update all 3 Profile UTxOs:
    //     - Client: (same as AI finalization)
    //     - Freelancer: (same as AI finalization)
    //     - Arbitrator:
    //       * arbitrations_completed += 1
    //       * arbitration_score += 5
    //       * available_balance += arbitrator_fee
    // 16. All Profile NFTs returned
  }

  else(_ctx: ScriptContext) {
    fail @"invalid handler called"
  }
}
