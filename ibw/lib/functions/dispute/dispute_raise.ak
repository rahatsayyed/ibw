use aiken/collection/dict
use aiken/collection/list
use aiken/option
use cardano/address.{Script}
use cardano/assets.{PolicyId}
use cardano/transaction.{InlineDatum, Input, Output, Transaction}
use types/types.{
  DisputeDatum, Disputed, Pending, ProjectDatum, UserProfileDatum,
}

pub fn validate_dispute_raise(
  tx: Transaction,
  policy_id: PolicyId,
  project_nft: PolicyId,
  profile_nft: PolicyId,
) -> Bool {
  // 1. Mint exactly ONE Dispute NFT
  expect [Pair(_, 1)] =
    tx.mint
      |> assets.tokens(policy_id)
      |> dict.to_pairs

  // 2. Validate Dispute UTxO created at script address with DisputeDatum
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
  expect InlineDatum(d_datum) = dispute_output.datum
  expect dispute_datum: DisputeDatum = d_datum

  // Validate DisputeDatum initial state
  let dispute_datum_check =
    dispute_datum.state == Pending && option.is_none(dispute_datum.ai_agent_id) && option.is_none(
      dispute_datum.ai_decision,
    ) && option.is_none(dispute_datum.completion_percentage) && option.is_none(
      dispute_datum.ai_confidence,
    ) && option.is_none(dispute_datum.ai_analysis_hash) && option.is_none(
      dispute_datum.re_dispute_deadline,
    ) && !dispute_datum.re_dispute_requested && option.is_none(
      dispute_datum.re_dispute_reason_hash,
    ) && option.is_none(dispute_datum.arbitrator_nft) && option.is_none(
      dispute_datum.final_decision,
    ) && option.is_none(dispute_datum.final_completion_percentage) && option.is_none(
      dispute_datum.resolved_at,
    )

  // 3. Validate project NFT in inputs and outputs
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

  expect Some(project_output) =
    list.find(
      tx.outputs,
      fn(output) {
        list.any(
          output.value |> assets.flatten,
          fn((pid, _, _)) { pid == project_nft },
        )
      },
    )

  expect InlineDatum(p_in_datum) = project_input.output.datum
  expect project_in_datum: ProjectDatum = p_in_datum

  expect InlineDatum(p_out_datum) = project_output.datum
  expect project_out_datum: ProjectDatum = p_out_datum

  // 4. Validate project output datum has status = Disputed
  let project_status_check = project_out_datum.status == Disputed

  // 5. Validate project output datum has dispute_nft set
  let dispute_nft_check = option.is_some(project_out_datum.dispute_nft)

  // 6. Validate both profile NFTs in inputs and outputs
  // Extract client and freelancer NFT asset classes from project datum
  let client_nft_class = project_in_datum.client_nft
  expect Some(freelancer_nft_class) = project_in_datum.freelancer_nft
  
  // Client Profile - find input containing client NFT
  expect Some(client_input) =
    list.find(
      tx.inputs,
      fn(input) {
        list.any(
          input.output.value |> assets.flatten,
          fn((pid, tn, _)) {
            pid == client_nft_class.policy_id && tn == client_nft_class.asset_name
          },
        )
      },
    )

  // Freelancer Profile - find input containing freelancer NFT
  expect Some(freelancer_input) =
    list.find(
      tx.inputs,
      fn(input) {
        list.any(
          input.output.value |> assets.flatten,
          fn((pid, tn, _)) {
            pid == freelancer_nft_class.policy_id && tn == freelancer_nft_class.asset_name
          },
        )
      },
    )

  // Find corresponding outputs
  expect Some(client_output) =
    list.find(
      tx.outputs,
      fn(output) {
        list.any(
          output.value |> assets.flatten,
          fn((pid, tn, _)) {
            pid == client_nft_class.policy_id && tn == client_nft_class.asset_name
          },
        )
      },
    )

  expect Some(freelancer_output) =
    list.find(
      tx.outputs,
      fn(output) {
        list.any(
          output.value |> assets.flatten,
          fn((pid, tn, _)) {
            pid == freelancer_nft_class.policy_id && tn == freelancer_nft_class.asset_name
          },
        )
      },
    )

  // 7. Validate both profile output datums have total_disputed incremented
  expect InlineDatum(c_in_d) = client_input.output.datum
  expect client_in_datum: UserProfileDatum = c_in_d
  expect InlineDatum(c_out_d) = client_output.datum
  expect client_out_datum: UserProfileDatum = c_out_d

  expect InlineDatum(f_in_d) = freelancer_input.output.datum
  expect freelancer_in_datum: UserProfileDatum = f_in_d
  expect InlineDatum(f_out_d) = freelancer_output.datum
  expect freelancer_out_datum: UserProfileDatum = f_out_d

  let client_disputed_check =
    client_out_datum.total_disputed == client_in_datum.total_disputed + 1
  let freelancer_disputed_check =
    freelancer_out_datum.total_disputed == freelancer_in_datum.total_disputed + 1

  dispute_datum_check? && project_status_check? && dispute_nft_check? && client_disputed_check? && freelancer_disputed_check?
}
