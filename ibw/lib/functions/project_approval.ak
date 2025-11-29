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

  // 5. Extract client_address from Profile UTxO datum
  // 6. client_address == tx signer
  let signer_check =
    list.has(tx.extra_signatories, client_datum.user_address.pkh)

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

  let freelancer_address = freelancer_datum.user_address

  // 13. Validate funds go to correct freelancer address
  // Use addresses.from_wallet from logical-mechanism assist
  let freelancer_addr = addresses.from_wallet(freelancer_address)

  // Find the total value sent to freelancer.
  let value_to_freelancer =
    list.foldl(
      tx.outputs,
      assets.zero,
      fn(out, acc) {
        if out.address == freelancer_addr {
          assets.merge(acc, out.value)
        } else {
          acc
        }
      },
    )

  // Check payment amount
  let payment_check =
    ( value_to_freelancer |> assets.lovelace_of ) >= input_datum.project_amount

  status_check? && client_nft_match? && signer_check? && payment_check?
}

fn inline_datum(d: Datum) -> UserProfileDatum {
  expect InlineDatum(d_data) = d
  expect datum: UserProfileDatum = d_data
  datum
}
