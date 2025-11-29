//// This module contains functions for validating withdrawal operations from user profiles.

use aiken/collection/list
use cardano/address.{Address}
use cardano/addresses
use cardano/assets.{PolicyId}
use cardano/transaction.{Output, Transaction}
use cardano/tx
use types/types.{UserProfileDatum}
use types/wallet.{Wallet}

/// Validates that the withdrawal amount does NOT exceed the available balance.
///
/// # Arguments
/// * `available_balance` - The current available balance in the datum
/// * `withdrawal_amount` - The amount being withdrawn
///
/// # Returns
/// `True` if withdrawal_amount <= available_balance
pub fn verify_sufficient_balance(
  available_balance: Int,
  withdrawal_amount: Int,
) -> Bool {
  withdrawal_amount <= available_balance
}

/// Validates that the balances are correctly updated after withdrawal.
///
/// # Arguments
/// * `input_datum` - The UserProfileDatum from the input UTxO
/// * `output_datum` - The UserProfileDatum from the output UTxO
/// * `withdrawal_amount` - The amount being withdrawn
///
/// # Returns
/// `True` if both total_balance and available_balance are decreased by withdrawal_amount
pub fn verify_balance_decrease(
  input_datum: UserProfileDatum,
  output_datum: UserProfileDatum,
  withdrawal_amount: Int,
) -> Bool {
  and {
    // total_balance should decrease by withdrawal_amount
    output_datum.total_balance == input_datum.total_balance - withdrawal_amount,
    // available_balance should decrease by withdrawal_amount
    output_datum.available_balance == input_datum.available_balance - withdrawal_amount,
  }
}

/// Validates that the withdrawal amount is sent to the user's wallet address.
///
/// # Arguments
/// * `outputs` - List of transaction outputs
/// * `user_wallet` - The user's wallet from the datum
/// * `withdrawal_amount` - The amount that should be sent to the user
///
/// # Returns
/// `True` if at least withdrawal_amount is sent to the user's address
pub fn verify_withdrawal_to_user(
  outputs: List<Output>,
  user_wallet: Wallet,
  withdrawal_amount: Int,
) -> Bool {
  let user_address = addresses.from_wallet(user_wallet)
  
  // Sum all lovelace sent to the user's address
  let sum_to_user =
    fn(sum, output: Output) {
      if output.address == user_address {
        assets.lovelace_of(output.value) + sum
      } else {
        sum
      }
    }
  
  let total_to_user = list.reduce(outputs, 0, sum_to_user)
  
  // Verify at least withdrawal_amount is sent to user
  total_to_user >= withdrawal_amount
}

/// Validates that all non-balance fields remain unchanged during withdrawal.
///
/// # Arguments
/// * `input_datum` - The UserProfileDatum from the input UTxO
/// * `output_datum` - The UserProfileDatum from the output UTxO
///
/// # Returns
/// `True` if all other fields are unchanged
pub fn verify_unchanged_fields_withdrawal(
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

/// Validates that the Profile NFT exists in both input and output.
///
/// # Arguments
/// * `outputs` - List of transaction outputs
/// * `policy_id` - The policy ID of the profile NFT
/// * `token_name` - The asset name of the profile NFT
/// * `script_address` - The address where the NFT should be
///
/// # Returns
/// `True` if the Profile NFT is present in an output at the script address
pub fn verify_profile_nft_in_output(
  outputs: List<Output>,
  policy_id: PolicyId,
  token_name: ByteArray,
  script_address: Address,
) -> Bool {
  expect Some(output) =
    list.find(
      outputs,
      fn(o) {
        and {
          assets.quantity_of(o.value, policy_id, token_name) == 1,
          o.address == script_address,
        }
      },
    )
  True
}

/// Validates the complete withdrawal operation.
/// Ensures signer is correct, balance is sufficient, withdrawal is sent to user,
/// and all invariants are maintained.
///
/// # Arguments
/// * `tx` - The transaction
/// * `input_datum` - The UserProfileDatum from the input
/// * `output_datum` - The UserProfileDatum from the output
/// * `withdrawal_amount` - The amount being withdrawn
/// * `profile_nft_policy` - The policy ID of the profile NFT
/// * `profile_nft_name` - The asset name of the profile NFT
/// * `script_address` - The address of the user profile validator
///
/// # Returns
/// `True` if all withdrawal validations pass
pub fn validate_withdrawal(
  tx: Transaction,
  input_datum: UserProfileDatum,
  output_datum: UserProfileDatum,
  withdrawal_amount: Int,
  profile_nft_policy: PolicyId,
  profile_nft_name: ByteArray,
  script_address: Address,
) -> Bool {
  let Transaction { extra_signatories, outputs, .. } = tx

  and {
    // 1. Verify datum.user_address == tx signer
    tx.verify_signature(extra_signatories, input_datum.user_address.pkh)?,
    // 2. Verify Profile NFT in input/output
    verify_profile_nft_in_output(
      outputs,
      profile_nft_policy,
      profile_nft_name,
      script_address,
    )?,
    // 3. Verify withdrawal_amount <= available_balance
    verify_sufficient_balance(
      input_datum.available_balance,
      withdrawal_amount,
    )?,
    // 4. Verify balances are decreased correctly
    verify_balance_decrease(input_datum, output_datum, withdrawal_amount)?,
    // 5. Verify withdrawal_amount sent to user's wallet
    verify_withdrawal_to_user(outputs, input_datum.user_address, withdrawal_amount)?,
    // 6. Verify all other fields unchanged
    verify_unchanged_fields_withdrawal(input_datum, output_datum)?,
    // 7. Verify output lovelace matches datum total_balance
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

/// Calculates the withdrawal amount from input and output balances.
///
/// # Arguments
/// * `input_balance` - The total balance in the input datum
/// * `output_balance` - The total balance in the output datum
///
/// # Returns
/// The withdrawal amount (input - output)
pub fn calculate_withdrawal_amount(
  input_balance: Int,
  output_balance: Int,
) -> Int {
  input_balance - output_balance
}
