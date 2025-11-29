use aiken/collection/list
use cardano/addresses
use cardano/assets.{PolicyId}
use cardano/transaction.{Datum, InlineDatum, Transaction}
use types/types.{ProjectDatum, Submitted, UserProfileDatum}
use types/wallet.{Wallet}

pub fn validate_project_approval(
  tx: Transaction,
  input_datum: ProjectDatum,
  profile_nft_policy: PolicyId,
) -> Bool {
  // Project Approval
  // ----------------
  // 1. status == Submitted
  let status_check = input_datum.status == Submitted
  trace @"project_approval:status": input_datum.status

  // 2. Client's Profile NFT in inputs
  // 3. Project NFT in inputs (Implicit)
  // 4. datum.client_nft == client's Profile NFT
  expect Some(client_input) =
    list.find(
      tx.inputs,
      fn(input) {
        list.any(
          input.output.value |> assets.flatten,
          fn((pid, _, _)) { pid == profile_nft_policy },
        )
      },
    )

  let client_datum: UserProfileDatum =
    client_input.output.datum |> inline_datum

  let client_nft_match =
    input_datum.client_nft == client_datum.profile_nft
  trace @"project_approval:client_nft_match": client_nft_match

  // 5. Extract client_address from Profile UTxO datum
  // 6. client_address == tx signer
  let signer_check =
    list.has(tx.extra_signatories, client_datum.user_address.pkh)
  trace @"project_approval:signer_check": signer_check

  // 9. Project UTxO consumed (not returned)

  // 11. Full amount sent to freelancer: project_amount
  expect Some(freelancer_input) =
    list.find(
      tx.inputs,
      fn(input) {
        let has_policy =
          list.any(
            input.output.value |> assets.flatten,
            fn((pid, _, _)) { pid == profile_nft_policy },
          )
        
        if has_policy {
           let d: UserProfileDatum = input.output.datum |> inline_datum
           input_datum.freelancer_nft == Some(d.profile_nft)
        } else {
           False
        }
      },
    )

  let freelancer_datum: UserProfileDatum =
    freelancer_input.output.datum |> inline_datum

  // 13. Validate funds go to Freelancer Profile UTxO (increasing their balance)
  // Find Freelancer Output by NFT
  expect Some(freelancer_output) =
    list.find(
      tx.outputs,
      fn(out) {
        list.any(
          out.value |> assets.flatten,
          fn((pid, _, _)) { pid == profile_nft_policy },
        ) &&
        // Ensure it's the same NFT as input (freelancer_datum.profile_nft)
        // We know the policy matches, check token name if needed, but policy is usually unique per profile script?
        // Actually profile_nft_policy is the policy for ALL profiles.
        // We need to match the specific asset name.
        assets.quantity_of(out.value, profile_nft_policy, freelancer_datum.profile_nft.asset_name) == 1
      }
    )

  // Check that Freelancer Profile value increased by at least project_amount
  let value_increase_check =
    assets.lovelace_of(freelancer_output.value) >= assets.lovelace_of(freelancer_input.output.value) + input_datum.project_amount
  
  trace @"project_approval:value_increase": value_increase_check, assets.lovelace_of(freelancer_output.value), assets.lovelace_of(freelancer_input.output.value), input_datum.project_amount

  status_check? && client_nft_match? && signer_check? && value_increase_check?
}

fn inline_datum(d: Datum) -> UserProfileDatum {
  expect InlineDatum(d_data) = d
  expect datum: UserProfileDatum = d_data
  datum
}
