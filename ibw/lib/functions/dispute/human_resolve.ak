use aiken/collection/list

use cardano/assets.{PolicyId}
use cardano/transaction.{InlineDatum, Transaction}
use functions/common
use types/types.{AssetClass, DisputeDatum, HumanReview, ProjectDatum}

pub fn validate_human_resolve(
  tx: Transaction,
  policy_id: PolicyId,
  project_nft: PolicyId,
  _profile_nft: PolicyId,
  decision: ByteArray,
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

  // 4. Fund Verification
  expect Some(project_input) =
    list.find(
      tx.inputs,
      fn(input) {
        list.any(
          input.output.value |> assets.flatten,
          fn((pid, _, _)) { pid == project_nft },
        )
      },
    )
  expect InlineDatum(p_datum) = project_input.output.datum
  expect project_datum: ProjectDatum = p_datum

  let payout_check = 
    if decision == "Client" {
        let client_nft = project_datum.client_nft
        common.verify_payout(tx, client_nft, project_datum.project_amount)
    } else if decision == "Freelancer" {
        expect Some(freelancer_nft) = project_datum.freelancer_nft
        common.verify_payout(tx, freelancer_nft, project_datum.project_amount)
    } else {
        False
    }

  arbitrator_authorized? && dispute_nft_burned? && payout_check?
}
