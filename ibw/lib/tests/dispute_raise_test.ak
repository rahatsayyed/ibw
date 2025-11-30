use aiken/collection/dict
use aiken/option
use cardano/address
use cardano/assets.{PolicyId}
use cardano/transaction.{
  InlineDatum, Input, Output, OutputReference, Transaction,
}
use functions/dispute/dispute_raise.{validate_dispute_raise}
use types/moment.{Moment}
use types/types.{
  AssetClass, DisputeDatum, Disputed, Pending, ProjectDatum, Submitted,
  UserProfileDatum,
}
use types/wallet.{Wallet}

const mock_dispute_pid: PolicyId =
  #"11111111111111111111111111111111111111111111111111111111"

const mock_project_pid: PolicyId =
  #"22222222222222222222222222222222222222222222222222222222"

const mock_profile_pid: PolicyId =
  #"33333333333333333333333333333333333333333333333333333333"

const mock_client_tn: ByteArray = "client"
const mock_freelancer_tn: ByteArray = "freelancer"
const mock_project_tn: ByteArray = "project"
const mock_dispute_tn: ByteArray = "dispute"

const mock_script_hash: ByteArray =
  #"44444444444444444444444444444444444444444444444444444444"

fn get_mock_wallet() -> Wallet {
  Wallet {
    pkh: #"00000000000000000000000000000000000000000000000000000000",
    sc: #"00000000000000000000000000000000000000000000000000000000",
  }
}

fn get_mock_profile_datum(total_disputed: Int) -> UserProfileDatum {
  UserProfileDatum {
    user_address: get_mock_wallet(),
    username_hash: "mock_username",
    profile_nft: AssetClass {
      policy_id: mock_profile_pid,
      asset_name: mock_client_tn,
    },
    active_projects_as_client: 0,
    active_projects_as_freelancer: 0,
    total_balance: 100,
    project_collateral: 0,
    available_balance: 100,
    reputation_score: 0,
    total_client_completed: 0,
    total_freelancer_completed: 0,
    total_disputed,
    fraud_count: 0,
    arbitration_score: 0,
    arbitrations_completed: 0,
    registered_at: Moment { start: 1000, end: 1000 },
  }
}

fn get_mock_project_datum(status: types.ProjectStatus) -> ProjectDatum {
  ProjectDatum {
    project_id: "project_id",
    project_nft: AssetClass {
      policy_id: mock_project_pid,
      asset_name: mock_project_tn,
    },
    client_nft: AssetClass {
      policy_id: mock_profile_pid,
      asset_name: mock_client_tn,
    },
    freelancer_nft: Some(
      AssetClass { policy_id: mock_profile_pid, asset_name: mock_freelancer_tn },
    ),
    project_amount: 100,
    collateral_rate: 10,
    minimum_completion_percentage: 100,
    description_hash: "desc",
    success_criteria_hash: "criteria",
    github_repo_hash: "repo",
    metadata_url: "url",
    status,
    created_at: Moment { start: 1000, end: 1000 },
    completion_deadline: Moment { start: 2000, end: 2000 },
    submission_details_hash: Some("submission"),
    submission_time: Some(Moment { start: 1500, end: 1500 }),
    dispute_nft: if status == Disputed {
      Some(
        AssetClass { policy_id: mock_dispute_pid, asset_name: mock_dispute_tn },
      )
    } else {
      None
    },
  }
}

fn get_mock_dispute_datum() -> DisputeDatum {
  DisputeDatum {
    ai_agent_id: None,
    ai_decision: None,
    completion_percentage: None,
    ai_confidence: None,
    ai_analysis_hash: None,
    re_dispute_deadline: None,
    state: Pending,
    re_dispute_requested: False,
    re_dispute_reason_hash: None,
    arbitrator_nft: None,
    final_decision: None,
    final_completion_percentage: None,
    resolved_at: None,
  }
}

fn get_mock_utxo_ref(index: Int) -> OutputReference {
  OutputReference {
    transaction_id: #"0000000000000000000000000000000000000000000000000000000000000000",
    output_index: index,
  }
}

test test_validate_dispute_raise_success() {
  let script_address = address.from_script(mock_script_hash)

  // Inputs
  let client_in_datum = get_mock_profile_datum(0)
  let freelancer_in_datum =
    UserProfileDatum {
      ..get_mock_profile_datum(0),
      profile_nft: AssetClass {
        policy_id: mock_profile_pid,
        asset_name: mock_freelancer_tn,
      },
    }
  let project_in_datum = get_mock_project_datum(Submitted)

  let client_input =
    Input {
      output_reference: get_mock_utxo_ref(0),
      output: Output {
        address: script_address,
        value: assets.from_asset(mock_profile_pid, mock_client_tn, 1),
        datum: InlineDatum(client_in_datum),
        reference_script: None,
      },
    }

  let freelancer_input =
    Input {
      output_reference: get_mock_utxo_ref(1),
      output: Output {
        address: script_address,
        value: assets.from_asset(mock_profile_pid, mock_freelancer_tn, 1),
        datum: InlineDatum(freelancer_in_datum),
        reference_script: None,
      },
    }

  let project_input =
    Input {
      output_reference: get_mock_utxo_ref(2),
      output: Output {
        address: script_address,
        value: assets.from_asset(mock_project_pid, mock_project_tn, 1),
        datum: InlineDatum(project_in_datum),
        reference_script: None,
      },
    }

  // Outputs
  let client_out_datum =
    UserProfileDatum { ..client_in_datum, total_disputed: 1 }
  let freelancer_out_datum =
    UserProfileDatum { ..freelancer_in_datum, total_disputed: 1 }
  let project_out_datum = get_mock_project_datum(Disputed)
  let dispute_out_datum = get_mock_dispute_datum()

  let client_output =
    Output {
      address: script_address,
      value: assets.from_asset(mock_profile_pid, mock_client_tn, 1),
      datum: InlineDatum(client_out_datum),
      reference_script: None,
    }

  let freelancer_output =
    Output {
      address: script_address,
      value: assets.from_asset(mock_profile_pid, mock_freelancer_tn, 1),
      datum: InlineDatum(freelancer_out_datum),
      reference_script: None,
    }

  let project_output =
    Output {
      address: script_address,
      value: assets.from_asset(mock_project_pid, mock_project_tn, 1),
      datum: InlineDatum(project_out_datum),
      reference_script: None,
    }

  let dispute_output =
    Output {
      address: script_address,
      value: assets.from_asset(mock_dispute_pid, mock_dispute_tn, 1),
      datum: InlineDatum(dispute_out_datum),
      reference_script: None,
    }

  let tx =
    Transaction {
      ..transaction.placeholder,
      inputs: [client_input, freelancer_input, project_input],
      outputs: [
        client_output, freelancer_output, project_output, dispute_output,
      ],
      mint: assets.from_asset(mock_dispute_pid, mock_dispute_tn, 1),
    }

  validate_dispute_raise(
    tx,
    mock_dispute_pid,
    mock_project_pid,
    mock_profile_pid,
  )
}
