use cardano/address
use cardano/assets.{PolicyId}
use cardano/transaction.{InlineDatum, Input, Output, OutputReference, Transaction}
use functions/deposit.{
  validate_deposit, verify_balance_update, verify_output_lovelace_matches_datum,
  verify_profile_nft_in_input, verify_profile_nft_returned,
  verify_unchanged_fields,
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

fn get_mock_datum() -> UserProfileDatum {
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

// Tests that verify_profile_nft_in_input returns true when the input contains the profile NFT.
test test_verify_profile_nft_in_input_success() {
  let datum = get_mock_datum()
  let input =
    Input {
      output_reference: OutputReference {
        transaction_id: #"0000000000000000000000000000000000000000000000000000000000000000",
        output_index: 0,
      },
      output: Output {
        address: address.from_verification_key(mock_pkh),
        value: assets.from_asset(mock_policy_id, mock_token_name, 1),
        datum: InlineDatum(datum),
        reference_script: None,
      },
    }
  verify_profile_nft_in_input(input, mock_policy_id, mock_token_name)
}

// Tests that verify_profile_nft_returned returns true when the output contains the profile NFT at the expected address.
test test_verify_profile_nft_returned_success() {
  let datum = get_mock_datum()
  let expected_address = address.from_script(mock_script_hash)
  let output =
    Output {
      address: expected_address,
      value: assets.from_asset(mock_policy_id, mock_token_name, 1),
      datum: InlineDatum(datum),
      reference_script: None,
    }
  verify_profile_nft_returned(
    [output],
    mock_policy_id,
    mock_token_name,
    expected_address,
  )
}

// Tests that verify_balance_update correctly validates the increase in total and available balance.
test test_verify_balance_update_success() {
  let input_datum = get_mock_datum()
  let deposit_amount = 50
  let output_datum =
    UserProfileDatum {
      ..input_datum,
      total_balance: input_datum.total_balance + deposit_amount,
      available_balance: input_datum.available_balance + deposit_amount,
    }
  verify_balance_update(input_datum, output_datum, deposit_amount)
}

// Tests that verify_unchanged_fields returns true when all non-balance fields remain the same.
test test_verify_unchanged_fields_success() {
  let input_datum = get_mock_datum()
  let output_datum =
    UserProfileDatum {
      ..input_datum,
      total_balance: input_datum.total_balance + 50,
      available_balance: input_datum.available_balance + 50,
    }
  verify_unchanged_fields(input_datum, output_datum)
}

// Tests that verify_output_lovelace_matches_datum returns true when output lovelace matches datum total_balance.
test test_verify_output_lovelace_matches_datum_success() {
  let total_balance = 150
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

// Tests the full validate_deposit function with valid inputs.
test test_validate_deposit_success() {
  let input_datum = get_mock_datum()
  let deposit_amount = 50
  let output_datum =
    UserProfileDatum {
      ..input_datum,
      total_balance: input_datum.total_balance + deposit_amount,
      available_balance: input_datum.available_balance + deposit_amount,
    }
  let script_address = address.from_script(mock_script_hash)
  let output =
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
  let tx =
    Transaction {
      ..transaction.placeholder,
      outputs: [output],
      extra_signatories: [mock_pkh],
    }
  validate_deposit(
    tx,
    input_datum,
    output_datum,
    deposit_amount,
    mock_policy_id,
    mock_token_name,
    script_address,
  )
}
