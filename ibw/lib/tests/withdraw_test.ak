use cardano/address
use cardano/addresses
use cardano/assets.{PolicyId}
use cardano/transaction.{InlineDatum, Output, Transaction}
use functions/withdraw.{
  validate_withdrawal, verify_balance_decrease,
  verify_output_lovelace_matches_datum, verify_profile_nft_in_output,
  verify_sufficient_balance, verify_unchanged_fields_withdrawal,
  verify_withdrawal_to_user,
}
use types/moment.{Moment}
use types/types.{AssetClass, UserProfileDatum}
use types/wallet.{Wallet}

const mock_policy_id: PolicyId =
  #"00000000000000000000000000000000000000000000000000000000"

const mock_token_name: ByteArray = "mock_token"

const mock_pkh: ByteArray =
  #"00000000000000000000000000000000000000000000000000000000"

const mock_script_hash: ByteArray =
  #"11111111111111111111111111111111111111111111111111111111"

fn get_mock_wallet() -> Wallet {
  Wallet { pkh: mock_pkh, sc: mock_pkh }
}

fn get_mock_datum_with_balance() -> UserProfileDatum {
  UserProfileDatum {
    user_address: get_mock_wallet(),
    username_hash: "mock_username",
    profile_nft: AssetClass {
      policy_id: mock_policy_id,
      asset_name: mock_token_name,
    },
    active_projects_as_client: 0,
    active_projects_as_freelancer: 0,
    total_balance: 100,
    project_collateral: 0,
    available_balance: 100,
    reputation_score: 0,
    total_client_completed: 0,
    total_freelancer_completed: 0,
    total_disputed: 0,
    fraud_count: 0,
    arbitration_score: 0,
    arbitrations_completed: 0,
    registered_at: Moment { start: 1000, end: 1000 },
  }
}

// Tests that verify_sufficient_balance returns true when withdrawal amount is less than or equal to available balance.
test test_verify_sufficient_balance_success() {
  let available_balance = 100
  let withdrawal_amount = 50
  verify_sufficient_balance(available_balance, withdrawal_amount)
}

// Tests that verify_sufficient_balance fails when withdrawal amount exceeds available balance.
test test_verify_sufficient_balance_failure() {
  let available_balance = 100
  let withdrawal_amount = 150
  !verify_sufficient_balance(available_balance, withdrawal_amount)
}

// Tests that verify_balance_decrease correctly validates the decrease in balances.
test test_verify_balance_decrease_success() {
  let input_datum = get_mock_datum_with_balance()
  let withdrawal_amount = 50
  let output_datum =
    UserProfileDatum {
      ..input_datum,
      total_balance: input_datum.total_balance - withdrawal_amount,
      available_balance: input_datum.available_balance - withdrawal_amount,
    }
  verify_balance_decrease(input_datum, output_datum, withdrawal_amount)
}

// Tests that verify_profile_nft_in_output returns true when the output contains the profile NFT at the script address.
test test_verify_profile_nft_in_output_success() {
  let datum = get_mock_datum_with_balance()
  let script_address = address.from_script(mock_script_hash)
  let output =
    Output {
      address: script_address,
      value: assets.from_asset(mock_policy_id, mock_token_name, 1),
      datum: InlineDatum(datum),
      reference_script: None,
    }
  verify_profile_nft_in_output(
    [output],
    mock_policy_id,
    mock_token_name,
    script_address,
  )
}

// Tests that verify_unchanged_fields_withdrawal returns true when all non-balance fields remain unchanged.
test test_verify_unchanged_fields_withdrawal_success() {
  let input_datum = get_mock_datum_with_balance()
  let output_datum =
    UserProfileDatum {
      ..input_datum,
      total_balance: input_datum.total_balance - 50,
      available_balance: input_datum.available_balance - 50,
    }
  verify_unchanged_fields_withdrawal(input_datum, output_datum)
}

// Tests that verify_output_lovelace_matches_datum returns true when output lovelace matches datum total_balance.
test test_verify_output_lovelace_matches_datum_success() {
  let total_balance = 50
  let output =
    Output {
      address: address.from_script(mock_script_hash),
      value: assets.from_asset(mock_policy_id, mock_token_name, 1)
        |> assets.add(assets.ada_policy_id, assets.ada_asset_name, total_balance),
      datum: InlineDatum(Void),
      reference_script: None,
    }
  verify_output_lovelace_matches_datum(
    [output],
    mock_policy_id,
    mock_token_name,
    total_balance,
  )
}

// Tests the full validate_withdrawal function with valid inputs.
test test_validate_withdrawal_success() {
  let input_datum = get_mock_datum_with_balance()
  let withdrawal_amount = 50
  let output_datum =
    UserProfileDatum {
      ..input_datum,
      total_balance: input_datum.total_balance - withdrawal_amount,
      available_balance: input_datum.available_balance - withdrawal_amount,
    }
  let script_address = address.from_script(mock_script_hash)
  let user_address = addresses.from_wallet(get_mock_wallet())
  
  // Output with the profile NFT back to script
  let nft_output =
    Output {
      address: script_address,
      value: assets.from_asset(mock_policy_id, mock_token_name, 1)
        |> assets.add(
            assets.ada_policy_id,
            assets.ada_asset_name,
            output_datum.total_balance,
          ),
      datum: InlineDatum(output_datum),
      reference_script: None,
    }
  
  // Output sending withdrawn amount to user
  let user_output =
    Output {
      address: user_address,
      value: assets.from_lovelace(withdrawal_amount),
      datum: InlineDatum(Void),
      reference_script: None,
    }
  
  let tx =
    Transaction {
      ..transaction.placeholder,
      outputs: [nft_output, user_output],
      extra_signatories: [mock_pkh],
    }
  
  validate_withdrawal(
    tx,
    input_datum,
    output_datum,
    withdrawal_amount,
    mock_policy_id,
    mock_token_name,
    script_address,
  )
}
