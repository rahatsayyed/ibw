use aiken/collection/list
use cardano/address.{Address}
use cardano/assets.{PolicyId}
use cardano/transaction.{Output, Transaction}
use types/types.{UserProfileDatum}

/// Validates that freelancer profile remains unchanged during project submit
pub fn validate_freelancer_submit_profile(
  tx: Transaction,
  input_datum: UserProfileDatum,
  output_datum: UserProfileDatum,
  profile_nft_policy: PolicyId,
  profile_nft_name: ByteArray,
  script_address: Address,
) -> Bool {
  // All Profile fields should be identical
  let all_fields_unchanged =
    and {
      output_datum.user_address == input_datum.user_address,
      output_datum.username_hash == input_datum.username_hash,
      output_datum.profile_nft == input_datum.profile_nft,
      output_datum.active_projects_as_client == input_datum.active_projects_as_client,
      output_datum.active_projects_as_freelancer == input_datum.active_projects_as_freelancer,
      output_datum.project_collateral == input_datum.project_collateral,
      output_datum.total_balance == input_datum.total_balance,
      output_datum.available_balance == input_datum.available_balance,
      output_datum.reputation_score == input_datum.reputation_score,
      output_datum.total_client_completed == input_datum.total_client_completed,
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

  all_fields_unchanged? && nft_returned? && balance_matches?
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
