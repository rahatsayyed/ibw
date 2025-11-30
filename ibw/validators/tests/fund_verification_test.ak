use aiken/collection/list
use cardano/address
use cardano/assets
use cardano/transaction.{InlineDatum, Output, Transaction}
use functions/common
use types/types.{AssetClass}

test verify_payout_success() {
  let policy_id = #"00000000000000000000000000000000000000000000000000000000"
  let asset_name = #"416c696365" // "Alice"
  let profile_nft = AssetClass { policy_id, asset_name }
  
  let input_value = assets.from_lovelace(100) |> assets.add(policy_id, asset_name, 1)
  let output_value = assets.from_lovelace(200) |> assets.add(policy_id, asset_name, 1)
  
  let tx = Transaction {
    ..transaction.placeholder,
    inputs: [
      transaction.Input {
        output_reference: transaction.OutputReference { transaction_id: #"00", output_index: 0 },
        output: Output { address: address.from_verification_key(#"00"), value: input_value, datum: InlineDatum(Void), reference_script: None },
      }
    ],
    outputs: [
      Output { address: address.from_verification_key(#"00"), value: output_value, datum: InlineDatum(Void), reference_script: None }
    ]
  }
  
  common.verify_payout(tx, profile_nft, 100)
}

test verify_payout_failure() fail {
  let policy_id = #"00000000000000000000000000000000000000000000000000000000"
  let asset_name = #"416c696365" // "Alice"
  let profile_nft = AssetClass { policy_id, asset_name }
  
  let input_value = assets.from_lovelace(100) |> assets.add(policy_id, asset_name, 1)
  let output_value = assets.from_lovelace(150) |> assets.add(policy_id, asset_name, 1) // Only +50, expected +100
  
  let tx = Transaction {
    ..transaction.placeholder,
    inputs: [
      transaction.Input {
        output_reference: transaction.OutputReference { transaction_id: #"00", output_index: 0 },
        output: Output { address: address.from_verification_key(#"00"), value: input_value, datum: InlineDatum(Void), reference_script: None },
      }
    ],
    outputs: [
      Output { address: address.from_verification_key(#"00"), value: output_value, datum: InlineDatum(Void), reference_script: None }
    ]
  }
  
  common.verify_payout(tx, profile_nft, 100)
}
