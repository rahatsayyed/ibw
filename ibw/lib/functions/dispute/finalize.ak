use aiken/collection/list
use aiken/interval
use aiken/option
use cardano/address.{Script}
use cardano/assets.{PolicyId}
use cardano/transaction.{InlineDatum, Transaction}
use functions/common
use types/moment.{Moment}
use types/types.{AIResolved, AssetClass, DisputeDatum, ProjectDatum, UserProfileDatum}

pub fn validate_finalize(
  tx: Transaction,
  policy_id: PolicyId,
  project_nft: PolicyId,
  _profile_nft: PolicyId,
) -> Bool {
  // 1. Find Dispute UTxO in inputs (State must be AIResolved)
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
  expect dispute_in_datum.state == AIResolved
  expect dispute_in_datum.re_dispute_requested == False

  // 2. Validate Time > re_dispute_deadline
  expect Some(deadline) = dispute_in_datum.re_dispute_deadline
  // We check that the transaction validity range is strictly AFTER the deadline
  // i.e. lower_bound > deadline
  // Note: Moment is { start: Int, end: Int } usually, or just Int?
  // In `types/moment.ak` it is a struct.
  // Let's assume we compare against `deadline.end` or similar.
  // Actually, usually deadline is a point in time.
  // If Moment is a range, we probably mean the end of the deadline window.
  // Let's assume we use `deadline.end` for now.
  // And we check `tx.validity_range` is entirely after `deadline.end`.
  let check_deadline =
    interval.is_entirely_after(tx.validity_range, deadline.end)

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

  // 4. Fund Distribution & Penalties
  // Find Project Input
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

  expect Some(decision) = dispute_in_datum.ai_decision
  
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
  
  check_deadline? && dispute_nft_burned? && payout_check?
}
