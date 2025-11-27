//// This module contains functions for user profile NFT minting and registration validation.

use aiken/collection/list
use cardano/address.{Address}
use cardano/assets.{PolicyId, Value}
use cardano/transaction.{InlineDatum, Output, OutputReference, Transaction}
use cardano/tx
use cardano/value
use types/moment.{Moment}
use types/types.{AssetClass, UserProfileDatum}
use types/wallet.{Wallet}

/// Validates that exactly one unique Profile NFT is being minted.
/// The token name is generated from the output reference to ensure uniqueness.
///
/// # Arguments
/// * `mint` - The mint value from the transaction
/// * `policy_id` - The policy ID of the profile NFT
/// * `token_name` - The expected token name (generated from output reference)
///
/// # Returns
/// `True` if exactly one NFT is being minted, otherwise fails
pub fn verify_single_nft_mint(
  mint: Value,
  policy_id: PolicyId,
  token_name: ByteArray,
) -> Bool {
  value.prove_exact_nft(mint, policy_id, token_name)
}

/// Validates that the user's address in the datum matches the transaction signer.
///
/// # Arguments
/// * `user_wallet` - The wallet from the UserProfileDatum
/// * `signatories` - List of transaction signatories (extra_signatories from tx)
///
/// # Returns
/// `True` if the user's payment key hash is in the signatories list
pub fn verify_user_signature(
  user_wallet: Wallet,
  signatories: List<ByteArray>,
) -> Bool {
  tx.verify_signature(signatories, user_wallet.pkh)
}

/// Validates that all counters in a new UserProfileDatum start at zero.
///
/// # Arguments
/// * `datum` - The UserProfileDatum to validate
///
/// # Returns
/// `True` if all counters are initialized to 0
pub fn verify_initial_counters(datum: UserProfileDatum) -> Bool {
  and {
    datum.active_projects_as_client == 0,
    datum.active_projects_as_freelancer == 0,
    datum.total_balance == 0,
    datum.project_collateral == 0,
    datum.available_balance == 0,
    datum.reputation_score == 0,
    datum.total_client_completed == 0,
    datum.total_freelancer_completed == 0,
    datum.total_disputed == 0,
    datum.fraud_count == 0,
    datum.arbitration_score == 0,
    datum.arbitrations_completed == 0,
  }
}

/// Validates the complete user registration mint operation.
/// Ensures NFT uniqueness, correct signer, initial state, and proper output.
///
/// # Arguments
/// * `tx` - The transaction
/// * `policy_id` - The profile NFT policy ID
/// * `token_name` - The token name generated from output reference
///
/// # Returns
/// `True` if all registration validations pass
pub fn validate_user_registration(
  tx: Transaction,
  policy_id: PolicyId,
  token_name: ByteArray,
) -> Bool {
  let Transaction { mint, outputs, extra_signatories, .. } = tx

  // Find the output containing the minted Profile NFT
  expect Some(profile_output) =
    list.find(
      outputs,
      fn(o) { assets.quantity_of(o.value, policy_id, token_name) == 1 },
    )

  // Extract and validate the datum
  expect InlineDatum(datum_data) = profile_output.datum
  expect profile_datum: UserProfileDatum = datum_data

  and {
    // 1. Verify exactly one Profile NFT is minted
    verify_single_nft_mint(mint, policy_id, token_name)?,
    // 2. Verify the user's address matches transaction signer
    verify_user_signature(profile_datum.user_address, extra_signatories)?,
    // 3. Verify all counters start at 0
    verify_initial_counters(profile_datum)?,
  }
}

/// Finds an output containing a specific NFT and extracts its datum.
///
/// # Arguments
/// * `outputs` - List of transaction outputs
/// * `policy_id` - The policy ID to search for
/// * `token_name` - The asset name to search for
///
/// # Returns
/// The datum data from the output containing the NFT
pub fn find_output_with_nft(
  outputs: List<Output>,
  policy_id: PolicyId,
  token_name: ByteArray,
) -> Data {
  expect Some(output) =
    list.find(
      outputs,
      fn(o) { assets.quantity_of(o.value, policy_id, token_name) == 1 },
    )
  expect InlineDatum(datum) = output.datum
  datum
}
