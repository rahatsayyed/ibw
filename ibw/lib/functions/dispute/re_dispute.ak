use aiken/collection/list
use aiken/interval.{Finite}
use aiken/option
use cardano/assets.{PolicyId}
use cardano/transaction.{InlineDatum, Transaction}
use types/moment.{Moment}
use types/types.{AIResolved, DisputeDatum, HumanReview}

pub fn validate_re_dispute(
  tx: Transaction,
  policy_id: PolicyId,
  _project_nft: PolicyId,
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

  // 2. Validate Time <= re_dispute_deadline
  expect Some(deadline) = dispute_in_datum.re_dispute_deadline
  // We check that the transaction validity range upper bound is <= deadline
  let check_deadline =
    when tx.validity_range.upper_bound.bound_type is {
      Finite(upper_bound) -> upper_bound <= deadline.end
      _ -> False
    }

  // 3. Find Dispute UTxO in outputs (State must be HumanReview)
  expect Some(dispute_output) =
    list.find(
      tx.outputs,
      fn(output) {
        list.any(
          output.value |> assets.flatten,
          fn((pid, _, _)) { pid == policy_id },
        )
      },
    )

  expect InlineDatum(d_out_datum) = dispute_output.datum
  expect dispute_out_datum: DisputeDatum = d_out_datum

  // Validate output state and fields
  let state_check = dispute_out_datum.state == HumanReview
  let requested_check = dispute_out_datum.re_dispute_requested == True
  let reason_check = option.is_some(dispute_out_datum.re_dispute_reason_hash)

  // Validate other fields unchanged (except maybe those related to re-dispute)
  // ai_agent_id, ai_decision, etc. should remain same?
  // Yes, we preserve the history.
  let preserve_check =
    dispute_out_datum.ai_agent_id == dispute_in_datum.ai_agent_id && dispute_out_datum.ai_decision == dispute_in_datum.ai_decision && dispute_out_datum.completion_percentage == dispute_in_datum.completion_percentage && dispute_out_datum.ai_confidence == dispute_in_datum.ai_confidence && dispute_out_datum.ai_analysis_hash == dispute_in_datum.ai_analysis_hash

  check_deadline? && state_check? && requested_check? && reason_check? && preserve_check?
}
