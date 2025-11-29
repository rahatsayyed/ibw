use aiken/collection/list
use cardano/address.{Address}
use cardano/assets.{PolicyId}
use cardano/transaction.{Transaction}
use functions/common
use types/types.{UserProfileDatum}

/// Validates freelancer profile updates during project accept
pub fn validate_freelancer_accept_profile(
  tx: Transaction,
  input_datum: UserProfileDatum,
  output_datum: UserProfileDatum,
  profile_nft_policy: PolicyId,
  profile_nft_name: ByteArray,
  script_address: Address,
) -> Bool {
  // Freelancer Profile Updates for Accept:
  // - active_projects_as_freelancer += 1
  // - Other fields unchanged (collateral is managed separately if needed)
  
  let active_projects_check =
    output_datum.active_projects_as_freelancer == input_datum.active_projects_as_freelancer + 1

  // Verify all other fields unchanged
  let other_fields_unchanged =
    and {
      output_datum.user_address == input_datum.user_address,
      output_datum.username_hash == input_datum.username_hash,
      output_datum.profile_nft == input_datum.profile_nft,
      output_datum.active_projects_as_client == input_datum.active_projects_as_client,
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
  trace @"profile_accept:other_fields": other_fields_unchanged

  // Verify Profile NFT returned to same address
  let nft_returned =
    common.verify_profile_nft_returned(
      tx.outputs,
      profile_nft_policy,
      profile_nft_name,
      script_address,
    )
  trace @"profile_accept:nft_returned": nft_returned

  // Verify output lovelace matches datum total_balance
  let balance_matches =
    common.verify_output_lovelace_matches_datum(
      tx.outputs,
      profile_nft_policy,
      profile_nft_name,
      output_datum.total_balance,
    )
  trace @"profile_accept:balance_matches": balance_matches

  active_projects_check? && other_fields_unchanged? && nft_returned? && balance_matches?
}

