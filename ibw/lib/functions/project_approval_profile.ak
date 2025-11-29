use aiken/collection/list
use cardano/address.{Address}
use cardano/assets.{PolicyId}
use cardano/transaction.{Output, Transaction}
use types/types.{UserProfileDatum}

/// Validates client profile updates during project approval
pub fn validate_client_approval_profile(
  tx: Transaction,
  input_datum: UserProfileDatum,
  output_datum: UserProfileDatum,
  profile_nft_policy: PolicyId,
  profile_nft_name: ByteArray,
  script_address: Address,
) -> Bool {
  // Client Profile Updates for Approval:
  // - active_projects_as_client -= 1
  // - project_collateral -= 25_000_000
  // - total_client_completed += 1
  // - reputation_score += 5
  
  let active_projects_check =
    output_datum.active_projects_as_client == input_datum.active_projects_as_client - 1
  trace @"client_approval:active_projects": active_projects_check

  let collateral_check =
    output_datum.project_collateral == input_datum.project_collateral - 25_000_000
  trace @"client_approval:collateral": collateral_check

  let completed_check =
    output_datum.total_client_completed == input_datum.total_client_completed + 1
  trace @"client_approval:completed": completed_check

  let reputation_check =
    output_datum.reputation_score == input_datum.reputation_score + 5
  trace @"client_approval:reputation": reputation_check

  // Verify other fields unchanged
  let other_fields_unchanged =
    and {
      output_datum.user_address == input_datum.user_address,
      output_datum.username_hash == input_datum.username_hash,
      output_datum.profile_nft == input_datum.profile_nft,
      output_datum.active_projects_as_freelancer == input_datum.active_projects_as_freelancer,
      output_datum.total_balance == input_datum.total_balance,
      output_datum.available_balance == input_datum.available_balance,
      output_datum.total_freelancer_completed == input_datum.total_freelancer_completed,
      output_datum.total_disputed == input_datum.total_disputed,
      output_datum.fraud_count == input_datum.fraud_count,
      output_datum.arbitration_score == input_datum.arbitration_score,
      output_datum.arbitrations_completed == input_datum.arbitrations_completed,
      output_datum.registered_at == input_datum.registered_at,
    }

  // Verify Profile NFT returned to same address
  let nft_returned =
    verify_profile_nft_returned(
      tx.outputs,
      profile_nft_policy,
      profile_nft_name,
      script_address,
    )

  // Verify output lovelace matches datum total_balance
  let balance_matches =
    verify_output_lovelace_matches_datum(
      tx.outputs,
      profile_nft_policy,
      profile_nft_name,
      output_datum.total_balance,
    )

  active_projects_check? && collateral_check? && completed_check? && reputation_check? && other_fields_unchanged? && nft_returned? && balance_matches?
}

/// Validates freelancer profile updates during project approval
pub fn validate_freelancer_approval_profile(
  tx: Transaction,
  input_datum: UserProfileDatum,
  output_datum: UserProfileDatum,
  project_amount: Int,
  profile_nft_policy: PolicyId,
  profile_nft_name: ByteArray,
  script_address: Address,
) -> Bool {
  // Freelancer Profile Updates for Approval:
  // - active_projects_as_freelancer -= 1
  // - project_collateral reduced (amount TBD)
  // - available_balance += project_amount
  // - total_freelancer_completed += 1
  // - reputation_score += 10
  
  let active_projects_check =
    output_datum.active_projects_as_freelancer == input_datum.active_projects_as_freelancer - 1
  trace @"freelancer_approval:active_projects": active_projects_check

  // Collateral reduction - assuming same 25M for now (may need adjustment)
  let collateral_check =
    output_datum.project_collateral <= input_datum.project_collateral
  trace @"freelancer_approval:collateral": collateral_check

  let available_balance_check =
    output_datum.available_balance == input_datum.available_balance + project_amount
  trace @"freelancer_approval:available_balance": available_balance_check, project_amount

  let completed_check =
    output_datum.total_freelancer_completed == input_datum.total_freelancer_completed + 1
  trace @"freelancer_approval:completed": completed_check

  let reputation_check =
    output_datum.reputation_score == input_datum.reputation_score + 10
  trace @"freelancer_approval:reputation": reputation_check

  // Verify other fields unchanged
  let other_fields_unchanged =
    and {
      output_datum.user_address == input_datum.user_address,
      output_datum.username_hash == input_datum.username_hash,
      output_datum.profile_nft == input_datum.profile_nft,
      output_datum.active_projects_as_client == input_datum.active_projects_as_client,
      output_datum.total_balance == input_datum.total_balance + project_amount,
      output_datum.total_client_completed == input_datum.total_client_completed,
      output_datum.total_disputed == input_datum.total_disputed,
      output_datum.fraud_count == input_datum.fraud_count,
      output_datum.arbitration_score == input_datum.arbitration_score,
      output_datum.arbitrations_completed == input_datum.arbitrations_completed,
      output_datum.registered_at == input_datum.registered_at,
    }

  // Verify Profile NFT returned to same address
  let nft_returned =
    verify_profile_nft_returned(
      tx.outputs,
      profile_nft_policy,
      profile_nft_name,
      script_address,
    )

  // Verify output lovelace matches datum total_balance
  let balance_matches =
    verify_output_lovelace_matches_datum(
      tx.outputs,
      profile_nft_policy,
      profile_nft_name,
      output_datum.total_balance,
    )

  active_projects_check? && collateral_check? && available_balance_check? && completed_check? && reputation_check? && other_fields_unchanged? && nft_returned? && balance_matches?
}

/// Helper: Verify Profile NFT returned to address
fn verify_profile_nft_returned(
  outputs: List<Output>,
  policy_id: PolicyId,
  token_name: ByteArray,
  expected_address: Address,
) -> Bool {
  expect Some(output) =
    list.find(
      outputs,
      fn(o) { assets.quantity_of(o.value, policy_id, token_name) == 1 },
    )
  output.address == expected_address
}

/// Helper: Verify output lovelace matches total_balance
fn verify_output_lovelace_matches_datum(
  outputs: List<Output>,
  policy_id: PolicyId,
  token_name: ByteArray,
  total_balance: Int,
) -> Bool {
  expect Some(output) =
    list.find(
      outputs,
      fn(o) { assets.quantity_of(o.value, policy_id, token_name) == 1 },
    )
  assets.lovelace_of(output.value) == total_balance
}
