use aiken/collection/list
use aiken/option
use cardano/assets.{PolicyId}
use cardano/transaction.{InlineDatum, Input, Output, Transaction}
use types/types.{Disputed, ProjectDatum, Submitted, UserProfileDatum}

pub fn validate_project_dispute(
  tx: Transaction,
  input_datum: ProjectDatum,
  output_datum: ProjectDatum,
  profile_nft: PolicyId,
) -> Bool {
  // 1. Validate client or freelancer Profile NFT in inputs
  // We need to check if the transaction is signed by either the client or the freelancer.
  // Or rather, if their Profile NFT is present in the inputs, implying they authorized it (via the profile script).
  // The profile script ensures that only the user can spend their profile UTxO.
  
  let client_nft_class = input_datum.client_nft
  let freelancer_nft_class_opt = input_datum.freelancer_nft
  
  expect Some(freelancer_nft_class) = freelancer_nft_class_opt

  let has_client_profile =
    list.any(
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

  let has_freelancer_profile =
    list.any(
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

  expect True = has_client_profile || has_freelancer_profile

  // 2. Validate output status = Disputed
  // 3. Validate input status = Submitted
  let status_check =
    input_datum.status == Submitted && output_datum.status == Disputed

  // 4. Validate output dispute_nft is set
  let dispute_nft_check = option.is_some(output_datum.dispute_nft)

  // 5. Validate all other project fields unchanged
  let fields_unchanged =
    output_datum.project_id == input_datum.project_id && output_datum.project_nft == input_datum.project_nft && output_datum.client_nft == input_datum.client_nft && output_datum.freelancer_nft == input_datum.freelancer_nft && output_datum.project_amount == input_datum.project_amount && output_datum.collateral_rate == input_datum.collateral_rate && output_datum.minimum_completion_percentage == input_datum.minimum_completion_percentage && output_datum.description_hash == input_datum.description_hash && output_datum.success_criteria_hash == input_datum.success_criteria_hash && output_datum.github_repo_hash == input_datum.github_repo_hash && output_datum.metadata_url == input_datum.metadata_url && output_datum.created_at == input_datum.created_at && output_datum.completion_deadline == input_datum.completion_deadline && output_datum.submission_details_hash == input_datum.submission_details_hash && output_datum.submission_time == input_datum.submission_time

  status_check? && dispute_nft_check? && fields_unchanged?
}
