use aiken/collection/list

use cardano/assets.{PolicyId}
use cardano/transaction.{InlineDatum, Transaction}
use types/types.{DisputeDatum, HumanReview}

pub fn validate_human_resolve(
  tx: Transaction,
  policy_id: PolicyId,
  _project_nft: PolicyId,
  _profile_nft: PolicyId,
) -> Bool {
  // 1. Find Dispute UTxO in inputs (State must be HumanReview)
  expect Some(dispute_input) =
    list.find(
      tx.inputs,
      fn(input) {
        list.any(
          input.output.value |> assets.flatten,
          fn((pid, _, _)) { pid == policy_id },
        )
      },
    )

  expect InlineDatum(d_in_datum) = dispute_input.output.datum
  expect dispute_in_datum: DisputeDatum = d_in_datum

  // Validate input state
  expect dispute_in_datum.state == HumanReview

  // 2. Validate Transaction signed by Arbitrator
  // We verify that the Arbitrator NFT is present in the inputs (spending or reference).
  // This proves that the owner of the Arbitrator NFT (the assigned arbitrator) has authorized the transaction.
  expect Some(arbitrator_nft) = dispute_in_datum.arbitrator_nft
  
  let arbitrator_authorized =
    list.any(
      list.concat(tx.inputs, tx.reference_inputs),
      fn(input) {
        list.any(
          input.output.value |> assets.flatten,
          fn((pid, tn, _)) {
            pid == arbitrator_nft.policy_id && tn == arbitrator_nft.asset_name
          },
        )
      },
    )

  // 3. Validate Dispute NFT is burned (not in outputs)
  let dispute_nft_burned =
    !list.any(
      tx.outputs,
      fn(output) {
        list.any(
          output.value |> assets.flatten,
          fn((pid, _, _)) { pid == policy_id },
        )
      },
    )

  arbitrator_authorized? && dispute_nft_burned?
}
