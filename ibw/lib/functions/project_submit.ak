use aiken/collection/list
use cardano/assets.{PolicyId}
use cardano/transaction.{Datum, InlineDatum, Input, Output, Transaction, ValidityRange}
use types/moment
use types/types.{Accepted, ProjectDatum, Submitted, UserProfileDatum}

pub fn validate_project_submit(
  tx: Transaction,
  project_input: Input,
  project_output: Output,
  input_datum: ProjectDatum,
  output_datum: ProjectDatum,
  profile_nft_policy: PolicyId,
) -> Bool {
  // Project Submit
  // --------------
  // 1. status == Accepted
  let status_check = input_datum.status == Accepted
  trace @"project_submit:status": input_datum.status

  // 2. Project NFT in inputs (Implicit)

  // 3. Freelancer's Profile NFT in inputs
  // 4. datum.freelancer_nft == freelancer's Profile NFT from input
  expect Some(freelancer_input) =
    list.find(
      tx.inputs,
      fn(input) {
        list.any(
          input.output.value |> assets.flatten,
          fn((pid, _, _)) { pid == profile_nft_policy },
        )
      },
    )

  let freelancer_datum: UserProfileDatum =
    freelancer_input.output.datum |> inline_datum

  let freelancer_nft_match =
    input_datum.freelancer_nft == Some(freelancer_datum.profile_nft)
  trace @"project_submit:freelancer_nft_match": freelancer_nft_match

  // 5. Extract freelancer_address from Profile UTxO datum
  // 6. freelancer_address == tx signer
  let signer_check =
    list.has(tx.extra_signatories, freelancer_datum.user_address.pkh)
  trace @"project_submit:signer_check": signer_check

  // 7. Project Datum updates:
  //    - status = Submitted
  //    - submission_details_hash = Some(hash)
  //    - submission_time = Some(current_time)
  let status_update_check = output_datum.status == Submitted
  let details_check = 
    when output_datum.submission_details_hash is {
      Some(hash) -> hash != ""
      None -> False
    }

  // 8. Project UTxO MUST return to SCRIPT
  // Implicitly checked by project_output being found at script address
  
  // 8.5. Project UTxO ADA preservation
  // Ensure the output Project UTxO has the same ADA as input
  let project_ada_preserved =
    assets.lovelace_of(project_output.value) >= assets.lovelace_of(project_input.output.value)
  trace @"project_submit:ada_preserved": project_ada_preserved, assets.lovelace_of(project_input.output.value), assets.lovelace_of(project_output.value)

  // 10. current_time <= completion_deadline (not expired)
  let deadline_check =
    moment.is_contained(input_datum.completion_deadline, tx.validity_range)

  // 11. Validate submission_details_hash not empty
  // Checked above.

  status_check? && freelancer_nft_match? && signer_check? && status_update_check? && details_check? && project_ada_preserved? && deadline_check?
}

fn inline_datum(d: Datum) -> UserProfileDatum {
  expect InlineDatum(d_data) = d
  expect datum: UserProfileDatum = d_data
  datum
}
