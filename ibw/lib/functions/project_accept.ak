use aiken/collection/list
use cardano/assets.{PolicyId}
use cardano/transaction.{Datum, InlineDatum, Input, Output, Transaction}
use types/types.{Accepted, Open, ProjectDatum, UserProfileDatum}

pub fn validate_project_accept(
  tx: Transaction,
  project_input: Input,
  project_output: Output,
  input_datum: ProjectDatum,
  output_datum: ProjectDatum,
  profile_nft_policy: PolicyId,
) -> Bool {
  // Project Accept
  // --------------
  // 1. status == Open
  let status_check = input_datum.status == Open
  trace @"project_accept:status": input_datum.status

  // 2. Freelancer's Profile NFT in inputs
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

  // Extract freelancer datum to get address
  let freelancer_datum: UserProfileDatum = freelancer_input.output.datum |> inline_datum
  trace @"project_accept:freelancer_nft": freelancer_datum.profile_nft

  // 3. Project NFT in inputs (Implicitly checked by the validator calling this)

  // 5. Project Datum updates:
  //    - freelancer_nft = Some(freelancer_profile_nft)
  //    - status = Accepted
  let freelancer_nft_check =
    output_datum.freelancer_nft == Some(freelancer_datum.profile_nft)
  let status_update_check = output_datum.status == Accepted

  // 6. Project UTxO ADA preservation
  // Ensure the output Project UTxO has at least the same ADA as input
  // (may increase if additional funds added, but should not decrease)
  let project_ada_preserved =
    assets.lovelace_of(project_output.value) >= assets.lovelace_of(project_input.output.value)

  // 7. Project UTxO MUST return to SCRIPT
  // Implicitly checked by project_output being found at script address

  // 9. Transaction signed by freelancer
  let signer_check = list.has(tx.extra_signatories, freelancer_datum.user_address.pkh)
  trace @"project_accept:signer_check": signer_check

  // 12. Ensure project not already accepted
  // Checked by `status == Open`.

  status_check? && freelancer_nft_check? && status_update_check? && project_ada_preserved? && signer_check?
}

fn inline_datum(d: Datum) -> UserProfileDatum {
  expect InlineDatum(d_data) = d
  expect datum: UserProfileDatum = d_data
  datum
}
