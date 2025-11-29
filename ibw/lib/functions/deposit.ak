//// This module contains functions for validating deposit operations on user profiles.

use aiken/collection/list
use cardano/address.{Address}
use cardano/assets.{PolicyId}
use cardano/transaction.{Input, Output, Transaction}
use cardano/tx
use types/types.{UserProfileDatum}

/// Validates that the Profile NFT exists in the input UTxO.
///
/// # Arguments
/// * `input` - The input UTxO to check
/// * `policy_id` - The policy ID of the profile NFT
/// * `token_name` - The asset name of the profile NFT
///
/// # Returns
/// `True` if the Profile NFT is present in the input
pub fn verify_profile_nft_in_input(
  input: Input,
  policy_id: PolicyId,
  token_name: ByteArray,
) -> Bool {
  assets.quantity_of(input.output.value, policy_id, token_name) == 1
}

/// Validates that the Profile NFT is returned to the same address in the output.
///
/// # Arguments
/// * `outputs` - List of transaction outputs
/// * `policy_id` - The policy ID of the profile NFT
/// * `token_name` - The asset name of the profile NFT
/// * `expected_address` - The address where NFT should be returned
///
/// # Returns
/// `True` if the Profile NFT is sent to the expected address
pub fn verify_profile_nft_returned(
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

/// Validates that the deposit correctly updates the user's balances.
///
/// # Arguments
/// * `input_datum` - The UserProfileDatum from the input UTxO
/// * `output_datum` - The UserProfileDatum from the output UTxO
/// * `deposit_amount` - The amount being deposited (in lovelace)
///
/// # Returns
/// `True` if balances are updated correctly
pub fn verify_balance_update(
  input_datum: UserProfileDatum,
  output_datum: UserProfileDatum,
  deposit_amount: Int,
) -> Bool {
  and {
    // total_balance should increase by deposit_amount
    output_datum.total_balance == input_datum.total_balance + deposit_amount,
    // available_balance should increase by deposit_amount
    output_datum.available_balance == input_datum.available_balance + deposit_amount,
  }
}

/// Validates that all other fields in the datum remain unchanged during deposit.
///
/// # Arguments
/// * `input_datum` - The UserProfileDatum from the input UTxO
/// * `output_datum` - The UserProfileDatum from the output UTxO
///
/// # Returns
/// `True` if all other fields are unchanged
pub fn verify_unchanged_fields(
  input_datum: UserProfileDatum,
  output_datum: UserProfileDatum,
) -> Bool {
  and {
    output_datum.user_address == input_datum.user_address,
    output_datum.username_hash == input_datum.username_hash,
    output_datum.profile_nft == input_datum.profile_nft,
    output_datum.active_projects_as_client == input_datum.active_projects_as_client,
    output_datum.active_projects_as_freelancer == input_datum.active_projects_as_freelancer,
    output_datum.project_collateral == input_datum.project_collateral,
    output_datum.reputation_score == input_datum.reputation_score,
    output_datum.total_client_completed == input_datum.total_client_completed,
    output_datum.total_freelancer_completed == input_datum.total_freelancer_completed,
    output_datum.total_disputed == input_datum.total_disputed,
    output_datum.fraud_count == input_datum.fraud_count,
    output_datum.arbitration_score == input_datum.arbitration_score,
    output_datum.arbitrations_completed == input_datum.arbitrations_completed,
    output_datum.registered_at == input_datum.registered_at,
  }
}

/// Validates the complete deposit operation.
/// Ensures signer matches user, NFT is preserved, and balances are updated correctly.
///
/// # Arguments
/// * `tx` - The transaction
/// * `input_datum` - The UserProfileDatum from the input
/// * `output_datum` - The UserProfileDatum from the output
/// * `deposit_amount` - The amount being deposited
/// * `profile_nft_policy` - The policy ID of the profile NFT
/// * `profile_nft_name` - The asset name of the profile NFT
/// * `script_address` - The address of the user profile validator
///
/// # Returns
/// `True` if all deposit validations pass
pub fn validate_deposit(
  tx: Transaction,
  input_datum: UserProfileDatum,
  output_datum: UserProfileDatum,
  deposit_amount: Int,
  profile_nft_policy: PolicyId,
  profile_nft_name: ByteArray,
  script_address: Address,
) -> Bool {
  let Transaction { extra_signatories, outputs, .. } = tx

  and {
    // 1. Verify datum.user_address == tx signer
    tx.verify_signature(extra_signatories, input_datum.user_address.pkh)?,
    // 2. Verify Profile NFT returned to same address
    verify_profile_nft_returned(
      outputs,
      profile_nft_policy,
      profile_nft_name,
      script_address,
    )?,
    // 3. Verify balance updates are correct
    verify_balance_update(input_datum, output_datum, deposit_amount)?,
    // 4. Verify all other fields unchanged
    verify_unchanged_fields(input_datum, output_datum)?,
    // 5. Verify output lovelace matches datum total_balance
    verify_output_lovelace_matches_datum(
      outputs,
      profile_nft_policy,
      profile_nft_name,
      output_datum.total_balance,
    )?,
  }
}

/// Validates that the output containing the Profile NFT has lovelace equal to the datum's total_balance.
///
/// # Arguments
/// * `outputs` - List of transaction outputs
/// * `policy_id` - The policy ID of the profile NFT
/// * `token_name` - The asset name of the profile NFT
/// * `total_balance` - The expected total balance from the datum
///
/// # Returns
/// `True` if the output lovelace matches the total_balance
pub fn verify_output_lovelace_matches_datum(
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

/// Calculates the deposit amount from input and output values.
///
/// # Arguments
/// * `input_lovelace` - The lovelace amount in the input UTxO
/// * `output_lovelace` - The lovelace amount in the output UTxO
///
/// # Returns
/// The deposit amount (output - input)
pub fn calculate_deposit_amount(
  input_lovelace: Int,
  output_lovelace: Int,
) -> Int {
  output_lovelace - input_lovelace
}
