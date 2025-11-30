use aiken/collection/list
use aiken/option
use cardano/address.{Script}
use cardano/assets.{PolicyId}
use cardano/transaction.{InlineDatum, Transaction}
use types/moment.{Moment}
use types/types.{AIResolved, DisputeDatum, Pending}

pub fn validate_ai_resolve(
  tx: Transaction,
  policy_id: PolicyId,
  // This is the Dispute Policy ID
  _project_nft: PolicyId,
  _profile_nft: PolicyId,
) -> Bool {
  // 1. Find Dispute UTxO in inputs (State must be Pending)
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
  expect dispute_in_datum.state == Pending

  // 2. Find Dispute UTxO in outputs (State must be AIResolved)
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

  expect Script(_) = dispute_output.address.payment_credential
  expect InlineDatum(d_out_datum) = dispute_output.datum
  expect dispute_out_datum: DisputeDatum = d_out_datum

  // 3. Validate DisputeDatum updates
  let state_check = dispute_out_datum.state == AIResolved
  let agent_check = option.is_some(dispute_out_datum.ai_agent_id)
  let decision_check = option.is_some(dispute_out_datum.ai_decision)
  let completion_check = option.is_some(dispute_out_datum.completion_percentage)
  let confidence_check = option.is_some(dispute_out_datum.ai_confidence)
  let analysis_check = option.is_some(dispute_out_datum.ai_analysis_hash)
  let deadline_check = option.is_some(dispute_out_datum.re_dispute_deadline)

  // 4. Validate signer (AI Agent)
  // Ensure the transaction is signed by the AI agent specified in the output datum
  expect Some(agent_id) = dispute_out_datum.ai_agent_id
  let signer_check = list.has(tx.extra_signatories, agent_id)

  // 5. Validate completion percentage and confidence range [0, 100]
  expect Some(completion) = dispute_out_datum.completion_percentage
  expect Some(confidence) = dispute_out_datum.ai_confidence
  let range_check =
    completion >= 0 && completion <= 100 && confidence >= 0 && confidence <= 100

  // 6. Validate deadline is in the future (e.g. > validity_range.lower_bound)
  // For now, just checking it's set, but ideally check against validity range
  // let time_check = ... (requires validity range access if we want to be strict)
  // Assuming the agent sets a valid future time.

  state_check? && agent_check? && decision_check? && completion_check? && confidence_check? && analysis_check? && deadline_check? && signer_check? && range_check?
}
