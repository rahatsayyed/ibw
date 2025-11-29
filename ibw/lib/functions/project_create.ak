use aiken/collection/list
use cardano/address.{Address}
use cardano/assets.{PolicyId}
use cardano/transaction.{Transaction}
use functions/common
use types/types.{UserProfileDatum}

pub fn validate_project_creation(
  tx: Transaction,
  input_datum: UserProfileDatum,
  output_datum: UserProfileDatum,
  profile_nft_policy: PolicyId,
  profile_nft_name: ByteArray,
  script_address: Address,
) -> Bool {
  // Project Create
  // --------------
  // 3. Verify client Profile UTxO updates:
  //    - active_projects_as_client += 1
  //    - project_collateral += 25_000_000
  //    - total_balance unchanged (or +25 if shortfall) -- Wait, the comment says "total_balance unchanged (or +25 if shortfall)".
  //      Let's look at the requirements again.
  //      "total_balance unchanged (or +25 if shortfall)" implies that if the user adds funds to cover collateral, total_balance increases.
  //      However, usually "total_balance" tracks the deposited amount.
  //      Let's assume for now that the user must have enough "available_balance" to lock "project_collateral".
  //      If they deposit more, that's a separate "Deposit" action usually, but here it might be bundled?
  //      The comment in userprofile.ak says:
  //      //    - total_balance unchanged (or +25 if shortfall)
  //      This suggests implicit deposit is allowed.
  //      Let's stick to the simpler interpretation first: User uses existing balance.
  //      Actually, looking at `deposit.ak` and `withdraw.ak`, `total_balance` seems to be the tracked user funds.
  //      If `project_collateral` increases, `available_balance` should decrease.
  //      `available_balance = total_balance - project_collateral`.
  //      So if `project_collateral` increases by 25, `available_balance` decreases by 25.
  //      The comment "total_balance unchanged" means no new funds added.
  //      So:
  //      active_projects_as_client_out == active_projects_as_client_in + 1
  //      project_collateral_out == project_collateral_in + 25_000_000
  //      total_balance_out == total_balance_in
  //      available_balance_out == available_balance_in - 25_000_000
  //      Wait, `available_balance` is a derived field in my mind, but it is stored in datum.
  //      Let's check `UserProfileDatum` again. Yes, it has `available_balance`.
  //      So we must enforce the math.

  let collateral_amount = 25_000_000

  let active_projects_check =
    output_datum.active_projects_as_client == input_datum.active_projects_as_client + 1

  let collateral_check =
    output_datum.project_collateral == input_datum.project_collateral + collateral_amount
  trace @"collateral_check": input_datum.project_collateral, collateral_amount, output_datum.project_collateral

  // We allow total_balance to increase if the user provides extra input ADA to cover the collateral,
  // but the simplest case is using existing funds.
  // The comment says "total_balance unchanged (or +25 if shortfall)".
  // This implies we should allow `total_balance` to increase, and if it does, `available_balance` math changes.
  // Let's enforce:
  // available_balance_out = total_balance_out - project_collateral_out
  // And check that available_balance_out >= 0.
  let balance_math_check =
    output_datum.available_balance == output_datum.total_balance - output_datum.project_collateral

  let sufficient_balance_check = output_datum.available_balance >= 0

  // 4. Client Profile NFT returned to client (which is the script address)
  // This is implicitly checked by `find_output_with_nft` in the main validator which returns `output_datum`.
  // But we should verify the output address is indeed the script address.
  // The `deposit` function does this: `expect output.address == script_address`.
  // We need to find the output that corresponds to `output_datum`.
  // In `userprofile.ak`, `output_datum` is derived from `user_registration.find_output_with_nft`.
  // We should probably pass the `output` itself or verify the address here if we can find it again,
  // or trust `userprofile.ak` to pass the right thing.
  // `userprofile.ak` passes `script_address`.
  // We need to ensure the output containing the NFT is at `script_address`.
  // `user_registration.find_output_with_nft` returns the datum, but we also need to check the address of that output.
  // Actually `userprofile.ak` does:
  //     let output_datum_data = user_registration.find_output_with_nft(...)
  // It doesn't check the address of that output there.
  // `deposit.ak` checks `output.address == script_address`.
  // We should do the same. We need to find the output again or have it passed.
  // `userprofile.ak` doesn't pass the `output` object, just the datum.
  // We can re-find it or assume `userprofile.ak` logic will be updated or we add a helper to find output.
  // Let's use `find_output_with_nft` equivalent that returns the Output.
  // Since we can't easily change `userprofile.ak`'s finding logic without refactoring it,
  // let's just re-find the output here to check its address.
  expect Some(output) =
    common.find_output_with_nft(
      tx.outputs,
      profile_nft_policy,
      profile_nft_name,
    )

  let address_check = output.address == script_address

  // 13. Validate project_collateral calculation (25 ADA * active_projects)
  // This is covered by the incremental check `project_collateral += 25_000_000`.
  // But we can also check `output.project_collateral == output.active_projects_as_client * 25_000_000`.
  // Note: `active_projects_as_client` tracks *active* projects.
  // If `project_collateral` is strictly for active projects, this holds.
  // If it includes past penalties or something, it might not.
  // Assuming it's just collateral for active ones:
  let collateral_consistency_check =
    output_datum.project_collateral == output_datum.active_projects_as_client * collateral_amount

  // 14. Ensure client has sufficient balance
  // Covered by `sufficient_balance_check`.
  // Verify other fields are unchanged
  let other_fields_unchanged = and {
      output_datum.user_address == input_datum.user_address,
      output_datum.username_hash == input_datum.username_hash,
      output_datum.profile_nft == input_datum.profile_nft,
      output_datum.active_projects_as_freelancer == input_datum.active_projects_as_freelancer,
      output_datum.reputation_score == input_datum.reputation_score,
      output_datum.total_client_completed == input_datum.total_client_completed,
      output_datum.total_freelancer_completed == input_datum.total_freelancer_completed,
      output_datum.total_disputed == input_datum.total_disputed,
      output_datum.fraud_count == input_datum.fraud_count,
      output_datum.arbitration_score == input_datum.arbitration_score,
      output_datum.arbitrations_completed == input_datum.arbitrations_completed,
      output_datum.registered_at == input_datum.registered_at,
    }

  active_projects_check? && collateral_check? && balance_math_check? && sufficient_balance_check? && address_check? && collateral_consistency_check? && other_fields_unchanged?
}
