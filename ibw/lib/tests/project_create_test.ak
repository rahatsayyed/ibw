use cardano/address
use cardano/assets.{PolicyId}
use cardano/transaction.{InlineDatum, Output, Transaction}
use functions/project_create.{validate_project_creation}
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

const collateral_amount = 25_000_000

fn get_mock_wallet() -> Wallet {
  Wallet { pkh: mock_pkh, sc: mock_pkh }
}

fn get_mock_datum_for_project_create() -> UserProfileDatum {
  UserProfileDatum {
    user_address: get_mock_wallet(),
    username_hash: "mock_username",
    profile_nft: AssetClass {
      policy_id: mock_policy_id,
      asset_name: mock_token_name,
    },
    active_projects_as_client: 0,
    active_projects_as_freelancer: 0,
    total_balance: 100_000_000,
    project_collateral: 0,
    available_balance: 100_000_000,
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

// Tests the full validate_project_creation function with valid inputs.
test test_validate_project_creation_success() {
  let input_datum = get_mock_datum_for_project_create()
  let output_datum =
    UserProfileDatum {
      ..input_datum,
      active_projects_as_client: input_datum.active_projects_as_client + 1,
      project_collateral: input_datum.project_collateral + collateral_amount,
      available_balance: input_datum.total_balance - collateral_amount,
    }
  
  let script_address = address.from_script(mock_script_hash)
  let output =
    Output {
      address: script_address,
      value: assets.from_asset(mock_policy_id, mock_token_name, 1),
      datum: InlineDatum(output_datum),
      reference_script: None,
    }
  
  let tx =
    Transaction {
      ..transaction.placeholder,
      outputs: [output],
      extra_signatories: [mock_pkh],
    }
  
  validate_project_creation(
    tx,
    input_datum,
    output_datum,
    mock_policy_id,
    mock_token_name,
    script_address,
  )
}

// Tests that validate_project_creation fails when collateral is not updated correctly.
test test_validate_project_creation_fail_wrong_collateral() {
  let input_datum = get_mock_datum_for_project_create()
  // Wrong collateral increase
  let output_datum =
    UserProfileDatum {
      ..input_datum,
      active_projects_as_client: input_datum.active_projects_as_client + 1,
      project_collateral: input_datum.project_collateral + 10_000_000,
      available_balance: input_datum.total_balance - 10_000_000,
    }
  
  let script_address = address.from_script(mock_script_hash)
  let output =
    Output {
      address: script_address,
      value: assets.from_asset(mock_policy_id, mock_token_name, 1),
      datum: InlineDatum(output_datum),
      reference_script: None,
    }
  
  let tx =
    Transaction {
      ..transaction.placeholder,
      outputs: [output],
      extra_signatories: [mock_pkh],
    }
  
  !validate_project_creation(
    tx,
    input_datum,
    output_datum,
    mock_policy_id,
    mock_token_name,
    script_address,
  )
}

// Tests that validate_project_creation fails when active_projects_as_client is not incremented.
test test_validate_project_creation_fail_no_increment() {
  let input_datum = get_mock_datum_for_project_create()
  // active_projects_as_client not incremented
  let output_datum =
    UserProfileDatum {
      ..input_datum,
      project_collateral: input_datum.project_collateral + collateral_amount,
      available_balance: input_datum.total_balance - collateral_amount,
    }
  
  let script_address = address.from_script(mock_script_hash)
  let output =
    Output {
      address: script_address,
      value: assets.from_asset(mock_policy_id, mock_token_name, 1),
      datum: InlineDatum(output_datum),
      reference_script: None,
    }
  
  let tx =
    Transaction {
      ..transaction.placeholder,
      outputs: [output],
      extra_signatories: [mock_pkh],
    }
  
  !validate_project_creation(
    tx,
    input_datum,
    output_datum,
    mock_policy_id,
    mock_token_name,
    script_address,
  )
}

// Tests that validate_project_creation fails when available_balance calculation is wrong.
test test_validate_project_creation_fail_wrong_balance() {
  let input_datum = get_mock_datum_for_project_create()
  // Wrong available_balance
  let output_datum =
    UserProfileDatum {
      ..input_datum,
      active_projects_as_client: input_datum.active_projects_as_client + 1,
      project_collateral: input_datum.project_collateral + collateral_amount,
      available_balance: input_datum.available_balance,
    }
  
  let script_address = address.from_script(mock_script_hash)
  let output =
    Output {
      address: script_address,
      value: assets.from_asset(mock_policy_id, mock_token_name, 1),
      datum: InlineDatum(output_datum),
      reference_script: None,
    }
  
  let tx =
    Transaction {
      ..transaction.placeholder,
      outputs: [output],
      extra_signatories: [mock_pkh],
    }
  
  !validate_project_creation(
    tx,
    input_datum,
    output_datum,
    mock_policy_id,
    mock_token_name,
    script_address,
  )
}
