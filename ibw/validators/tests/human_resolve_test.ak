use aiken/collection/dict
use aiken/collection/list
use aiken/interval
use aiken/option
use cardano/address.{Address, Script, VerificationKey}
use cardano/assets.{PolicyId}
use cardano/transaction.{
  InlineDatum, Input, Output, OutputReference, Transaction,
}
use functions/dispute/human_resolve
use types/moment.{Moment}
use types/types.{AssetClass, DisputeDatum, HumanReview, Open, ProjectDatum, ProjectStatus}

// Mock Data
const mock_policy_id: PolicyId = #"00000000000000000000000000000000000000000000000000000001"

const mock_project_nft: PolicyId =
  #"00000000000000000000000000000000000000000000000000000002"

const mock_profile_nft: PolicyId =
  #"00000000000000000000000000000000000000000000000000000003"

const mock_arbitrator_policy: PolicyId =
  #"00000000000000000000000000000000000000000000000000000004"

fn create_human_review_datum() -> DisputeDatum {
  DisputeDatum {
    ai_agent_id: None,
    ai_decision: None,
    completion_percentage: None,
    ai_confidence: None,
    ai_analysis_hash: None,
    re_dispute_deadline: None,
    state: HumanReview,
    re_dispute_requested: True,
    re_dispute_reason_hash: Some("reason"),
    arbitrator_nft: Some(
      AssetClass { policy_id: mock_arbitrator_policy, asset_name: "Arbiter" },
    ),
    final_decision: Some("Client"),
    final_completion_percentage: None,
    resolved_at: None,
  }
}

test validate_human_resolve_success() {
  let input_datum = create_human_review_datum()

  // Input 1: Dispute UTxO (with Dispute NFT)
  let dispute_value = assets.from_asset(mock_policy_id, "", 1)
  let dispute_input =
    Input {
      output_reference: OutputReference {
        transaction_id: #"0000000000000000000000000000000000000000000000000000000000000000",
        output_index: 0,
      },
      output: Output {
        address: Address {
          payment_credential: Script(mock_policy_id),
          stake_credential: None,
        },
        value: dispute_value,
        datum: InlineDatum(input_datum),
        reference_script: None,
      },
    }

  // Input 2: Arbitrator UTxO (with Arbitrator NFT) - simulating authorization
  let arb_value = assets.from_asset(mock_arbitrator_policy, "Arbiter", 1)
  let arb_input =
    Input {
      output_reference: OutputReference {
        transaction_id: #"0000000000000000000000000000000000000000000000000000000000000001",
        output_index: 0,
      },
      output: Output {
        address: Address {
          payment_credential: Script(mock_profile_nft), // Owned by arbitrator profile
          stake_credential: None,
        },
        value: arb_value,
        datum: InlineDatum(Void), // Datum doesn't matter for this check
        reference_script: None,
      },
    }

  // Project Input
  let client_nft_class = AssetClass { policy_id: mock_profile_nft, asset_name: "Client" }
  let project_datum = ProjectDatum {
      project_id: "id",
      project_nft: AssetClass { policy_id: mock_project_nft, asset_name: "" },
      client_nft: client_nft_class,
      freelancer_nft: None,
      project_amount: 100,
      collateral_rate: 0,
      minimum_completion_percentage: 0,
      description_hash: "",
      success_criteria_hash: "",
      github_repo_hash: "",
      metadata_url: "",
      status: Open,
      created_at: Moment { start: 0, end: 0 },
      completion_deadline: Moment { start: 0, end: 0 },
      submission_details_hash: None,
      submission_time: None,
      dispute_nft: None,
  }

  let project_input =
    Input {
      output_reference: OutputReference {
        transaction_id: #"00",
        output_index: 1,
      },
      output: Output {
        address: Address {
          payment_credential: Script(mock_project_nft),
          stake_credential: None,
        },
        value: assets.from_asset(mock_project_nft, "", 1),
        datum: InlineDatum(project_datum),
        reference_script: None,
      },
    }

  // Client Profile Input
  let client_input =
    Input {
      output_reference: OutputReference {
        transaction_id: #"00",
        output_index: 2,
      },
      output: Output {
        address: Address {
          payment_credential: VerificationKey(#"11"),
          stake_credential: None,
        },
        value: assets.from_lovelace(1000) |> assets.add(mock_profile_nft, "Client", 1),
        datum: InlineDatum(Void),
        reference_script: None,
      },
    }

  // Client Profile Output (Payout)
  let client_output =
    Output {
        address: Address {
          payment_credential: VerificationKey(#"11"),
          stake_credential: None,
        },
        value: assets.from_lovelace(1100) |> assets.add(mock_profile_nft, "Client", 1),
        datum: InlineDatum(Void),
        reference_script: None,
    }

  // Output: No Dispute NFT (Burned)
  // We just have some other output, e.g. payment to arbitrator
  let output_value = assets.from_lovelace(1000000)
  let arb_output =
    Output {
      address: Address {
        payment_credential: Script(mock_profile_nft),
        stake_credential: None,
      },
      value: output_value,
      datum: InlineDatum(Void),
      reference_script: None,
    }

  let tx =
    Transaction {
      inputs: [dispute_input, arb_input, project_input, client_input],
      reference_inputs: [],
      outputs: [arb_output, client_output],
      fee: 0,
      mint: assets.zero, // In reality, we should see mint -1, but the helper checks outputs for absence
      certificates: [],
      withdrawals: [],
      validity_range: interval.everything,
      extra_signatories: [],
      redeemers: [],
      datums: dict.empty,
      id: #"0000000000000000000000000000000000000000000000000000000000000000",
      votes: [],
      proposal_procedures: [],
      current_treasury_amount: None,
      treasury_donation: None,
    }

  human_resolve.validate_human_resolve(
    tx,
    mock_policy_id,
    mock_project_nft,
    mock_profile_nft,
  )
}
