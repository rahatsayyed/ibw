use aiken/collection/list
use cardano/address.{Address}
use cardano/assets.{PolicyId}
use cardano/transaction.{Output, Transaction}
use types/types.{AssetClass}

/// Helper: Verify Profile NFT returned to address
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

/// Helper: Verify output lovelace matches total_balance
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

/// Helper: Find output containing a specific NFT
pub fn find_output_with_nft(
  outputs: List<Output>,
  policy_id: PolicyId,
  token_name: ByteArray,
) -> Option<Output> {
  list.find(
    outputs,
    fn(o) { assets.quantity_of(o.value, policy_id, token_name) == 1 },
  )
}

pub fn verify_payout(tx: Transaction, profile_nft: AssetClass, amount: Int) -> Bool {
  expect Some(profile_input) =
    list.find(
      tx.inputs,
      fn(input) {
         assets.quantity_of(input.output.value, profile_nft.policy_id, profile_nft.asset_name) == 1
      }
    )
  
  expect Some(profile_output) =
    list.find(
      tx.outputs,
      fn(output) {
         assets.quantity_of(output.value, profile_nft.policy_id, profile_nft.asset_name) == 1
      }
    )

  assets.lovelace_of(profile_output.value) >= assets.lovelace_of(profile_input.output.value) + amount
}
