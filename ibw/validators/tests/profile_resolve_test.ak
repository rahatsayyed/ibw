use aiken/collection/dict
use aiken/collection/list
use aiken/interval
use aiken/option
use cardano/address.{Address, Script}
use cardano/assets.{PolicyId}
use cardano/transaction.{
  InlineDatum, Input, Output, OutputReference, Transaction,
}
use functions/dispute/profile_resolve
use types/moment.{Moment}
use types/types.{
  AssetClass, DisputeDatum, HumanReview, ProjectDatum, UserProfileDatum,
}
use types/wallet

// Mock Data
const mock_profile_policy: PolicyId =
  #"00000000000000000000000000000000000000000000000000000001"

const mock_project_policy: PolicyId =
  #"00000000000000000000000000000000000000000000000000000002"

const mock_dispute_policy: PolicyId =
  #"00000000000000000000000000000000000000000000000000000003"

fn create_mock_profile(
  nft_name: ByteArray,
  active_client: Int,
  active_freelancer: Int,
  completed_arb: Int,
  collateral: Int,
) -> UserProfileDatum {
  UserProfileDatum {
    user_address: wallet.Wallet { pkh: #"00", sc: #"" },
    username_hash: #"00",
    profile_nft: AssetClass {
      policy_id: mock_profile_policy,
      asset_name: nft_name,
    },
    active_projects_as_client: active_client,
    active_projects_as_freelancer: active_freelancer,
    total_balance: 1000,
    project_collateral: collateral,
    available_balance: 1000,
    reputation_score: 100,
    total_client_completed: 0,
    total_freelancer_completed: 0,
    total_disputed: 0,
    fraud_count: 0,
    arbitration_score: 0,
    arbitrations_completed: completed_arb,
    registered_at: Moment { start: 0, end: 0 },
  }
}

fn create_mock_project(
  client_nft: ByteArray,
  freelancer_nft: ByteArray,
) -> ProjectDatum {
  ProjectDatum {
    project_id: #"00",
    project_nft: AssetClass {
      policy_id: mock_project_policy,
      asset_name: "Project",
    },
    client_nft: AssetClass {
      policy_id: mock_profile_policy,
      asset_name: client_nft,
    },
    freelancer_nft: Some(
      AssetClass { policy_id: mock_profile_policy, asset_name: freelancer_nft },
    ),
    project_amount: 100,
    collateral_rate: 10,
    minimum_completion_percentage: 100,
    description_hash: #"00",
    success_criteria_hash: #"00",
    github_repo_hash: #"00",
    metadata_url: #"00",
    status: types.Disputed,
    created_at: Moment { start: 0, end: 0 },
    completion_deadline: Moment { start: 0, end: 0 },
    submission_details_hash: None,
    submission_time: None,
    dispute_nft: Some(
      AssetClass { policy_id: mock_dispute_policy, asset_name: "Dispute" },
    ),
  }
}

fn create_mock_dispute(arbitrator_nft: ByteArray) -> DisputeDatum {
  DisputeDatum {
    ai_agent_id: None,
    ai_decision: None,
    completion_percentage: None,
    ai_confidence: None,
    ai_analysis_hash: None,
    re_dispute_deadline: None,
    state: HumanReview,
    re_dispute_requested: True,
    re_dispute_reason_hash: None,
    arbitrator_nft: Some(
      AssetClass { policy_id: mock_profile_policy, asset_name: arbitrator_nft },
    ),
    final_decision: None,
    final_completion_percentage: None,
    resolved_at: None,
  }
}

test validate_client_resolve() {
  let client_nft = "Client"
  let freelancer_nft = "Freelancer"
  let arbitrator_nft = "Arbitrator"

  let input_datum = create_mock_profile(client_nft, 1, 0, 0, 25_000_000)
  let output_datum = create_mock_profile(client_nft, 0, 0, 0, 0) // Active -1, Collateral -25M

  let project_datum = create_mock_project(client_nft, freelancer_nft)
  let dispute_datum = create_mock_dispute(arbitrator_nft)

  // Construct Transaction inputs
  // Index 0: Project
  // Index 1: Dispute
  // Index 2: Profile (Client) - Current input being validated

  let project_input =
    Input {
      output_reference: OutputReference { transaction_id: #"00", output_index: 0 },
      output: Output {
        address: Address {
          payment_credential: Script(mock_project_policy),
          stake_credential: None,
        },
        value: assets.zero,
        datum: InlineDatum(project_datum),
        reference_script: None,
      },
    }

  let dispute_input =
    Input {
      output_reference: OutputReference { transaction_id: #"00", output_index: 1 },
      output: Output {
        address: Address {
          payment_credential: Script(mock_dispute_policy),
          stake_credential: None,
        },
        value: assets.zero,
        datum: InlineDatum(dispute_datum),
        reference_script: None,
      },
    }

  let tx =
    Transaction {
      inputs: [project_input, dispute_input], // Profile input is implicit in context, but helper needs index
      reference_inputs: [],
      outputs: [],
      fee: 0,
      mint: assets.zero,
      certificates: [],
      withdrawals: [],
      validity_range: interval.everything,
      extra_signatories: [],
      redeemers: [],
      datums: dict.empty,
      id: #"00",
      votes: [],
      proposal_procedures: [],
      current_treasury_amount: None,
      treasury_donation: None,
    }

  profile_resolve.validate_profile_resolve(
    tx,
    input_datum,
    output_datum,
    0, // Project Input Index
    1, // Dispute Input Index
    mock_profile_policy,
    client_nft,
    Address { payment_credential: Script(mock_profile_policy), stake_credential: None },
  )
}

test validate_arbitrator_resolve() {
  let client_nft = "Client"
  let freelancer_nft = "Freelancer"
  let arbitrator_nft = "Arbitrator"

  let input_datum = create_mock_profile(arbitrator_nft, 0, 0, 5, 0)
  let output_datum = create_mock_profile(arbitrator_nft, 0, 0, 6, 0) // Arb Completed +1

  let project_datum = create_mock_project(client_nft, freelancer_nft)
  let dispute_datum = create_mock_dispute(arbitrator_nft)

  let project_input =
    Input {
      output_reference: OutputReference { transaction_id: #"00", output_index: 0 },
      output: Output {
        address: Address {
          payment_credential: Script(mock_project_policy),
          stake_credential: None,
        },
        value: assets.zero,
        datum: InlineDatum(project_datum),
        reference_script: None,
      },
    }

  let dispute_input =
    Input {
      output_reference: OutputReference { transaction_id: #"00", output_index: 1 },
      output: Output {
        address: Address {
          payment_credential: Script(mock_dispute_policy),
          stake_credential: None,
        },
        value: assets.zero,
        datum: InlineDatum(dispute_datum),
        reference_script: None,
      },
    }

  let tx =
    Transaction {
      inputs: [project_input, dispute_input],
      reference_inputs: [],
      outputs: [],
      fee: 0,
      mint: assets.zero,
      certificates: [],
      withdrawals: [],
      validity_range: interval.everything,
      extra_signatories: [],
      redeemers: [],
      datums: dict.empty,
      id: #"00",
      votes: [],
      proposal_procedures: [],
      current_treasury_amount: None,
      treasury_donation: None,
    }

  profile_resolve.validate_profile_resolve(
    tx,
    input_datum,
    output_datum,
    0,
    1,
    mock_profile_policy,
    arbitrator_nft,
    Address { payment_credential: Script(mock_profile_policy), stake_credential: None },
  )
}
