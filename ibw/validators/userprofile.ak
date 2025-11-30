use aiken/collection/list
use cardano/address.{Script}
use cardano/assets.{PolicyId}
use cardano/script_context.{ScriptContext}
use cardano/transaction.{InlineDatum, OutputReference, Transaction, find_input}
use functions/deposit
use functions/dispute/profile_dispute
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
  ProjectDispute
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
      ProjectDispute ->
        // Project Dispute
        // ---------------
        // 1. Validate total_disputed incremented by 1
        // 2. Validate all other profile fields unchanged
        profile_dispute.validate_profile_dispute(
          tx,
          input_datum,
          output_datum,
          profile_nft_policy,
          profile_nft_name,
          script_address,
        )
    }
  }

  else(_ctx: ScriptContext) {
    fail @"invalid handler called"
  }
}
