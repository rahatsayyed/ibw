use aiken/collection/list
use cardano/address
use cardano/assets.{PolicyId, Value}
use cardano/transaction.{
  InlineDatum, Output, OutputReference, Transaction, TransactionId,
}
use functions/user_registration.{
  validate_user_registration, verify_initial_counters, verify_single_nft_mint,
  verify_user_signature,
}
use types/moment.{Moment}
use types/types.{AssetClass, UserProfileDatum}
use types/wallet.{Wallet}

const mock_policy_id: PolicyId =
  #"00000000000000000000000000000000000000000000000000000000"

const mock_token_name: ByteArray = "mock_token"

const mock_pkh: ByteArray =
  #"00000000000000000000000000000000000000000000000000000000"

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
    total_balance: 0,
    project_collateral: 0,
    available_balance: 0,
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

// Tests that verify_single_nft_mint returns true when exactly one token of the correct policy and name is minted.
test test_verify_single_nft_mint_success() {
  let mint = assets.from_asset(mock_policy_id, mock_token_name, 1)
  verify_single_nft_mint(mint, mock_policy_id, mock_token_name)
}

// Tests that verify_single_nft_mint fails when the minted quantity is not exactly one.
test test_verify_single_nft_mint_failure() {
  let mint = assets.from_asset(mock_policy_id, mock_token_name, 2)
  !verify_single_nft_mint(mint, mock_policy_id, mock_token_name)
}

// Tests that verify_user_signature returns true when the user's public key hash is present in the signatories list.
test test_verify_user_signature_success() {
  let wallet = get_mock_wallet()
  let signatories = [mock_pkh]
  verify_user_signature(wallet, signatories)
}

// Tests that verify_user_signature fails when the user's public key hash is missing from the signatories list.
test test_verify_user_signature_failure() {
  let wallet = get_mock_wallet()
  let signatories = []
  !verify_user_signature(wallet, signatories)
}

// Tests that verify_initial_counters returns true when all counters in the UserProfileDatum are initialized to zero.
test test_verify_initial_counters_success() {
  let datum = get_mock_datum()
  verify_initial_counters(datum)
}

// Tests that verify_initial_counters fails if any counter in the UserProfileDatum is not zero.
test test_verify_initial_counters_failure() {
  let datum =
    UserProfileDatum { ..get_mock_datum(), active_projects_as_client: 1 }
  !verify_initial_counters(datum)
}

// Tests the full user registration validation logic, ensuring all checks pass with a valid transaction and datum.
test test_validate_user_registration_success() {
  let mint = assets.from_asset(mock_policy_id, mock_token_name, 1)
  let datum = get_mock_datum()
  let output =
    Output {
      address: address.from_verification_key(mock_pkh),
      value: assets.from_asset(mock_policy_id, mock_token_name, 1),
      datum: InlineDatum(datum),
      reference_script: None,
    }
  let tx =
    Transaction {
      ..transaction.placeholder,
      mint,
      outputs: [output],
      extra_signatories: [mock_pkh],
    }
  validate_user_registration(tx, mock_policy_id, mock_token_name)
}
