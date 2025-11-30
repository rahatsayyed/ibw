use aiken/collection/dict
use aiken/collection/list
use aiken/crypto.{VerificationKeyHash}
use aiken/interval
use aiken/option
use cardano/address.{Address, Credential, Script, VerificationKey}
use cardano/assets.{Lovelace, PolicyId}
use cardano/transaction.{
  InlineDatum, Input, Output, OutputReference, Transaction,
  ValidityRange,
}
use functions/dispute/finalize
use types/moment.{Moment}
use types/types.{AIResolved, DisputeDatum, Pending}

// Mock Data
const mock_policy_id: PolicyId = #"00000000000000000000000000000000000000000000000000000001"

const mock_project_nft: PolicyId =
  #"00000000000000000000000000000000000000000000000000000002"

const mock_profile_nft: PolicyId =
  #"00000000000000000000000000000000000000000000000000000003"

const ai_agent_id: VerificationKeyHash =
  #"11111111111111111111111111111111111111111111111111111111"

fn create_resolved_datum() -> DisputeDatum {
  DisputeDatum {
    ai_agent_id: Some(ai_agent_id),
    ai_decision: Some("Client"),
    completion_percentage: Some(50),
    ai_confidence: Some(90),
    ai_analysis_hash: Some("hash"),
    re_dispute_deadline: Some(Moment { start: 1000, end: 1000 }),
    state: AIResolved,
    re_dispute_requested: False,
    re_dispute_reason_hash: None,
    arbitrator_nft: None,
    final_decision: None,
    final_completion_percentage: None,
    resolved_at: None,
  }
}

test validate_finalize_success() {
  let input_datum = create_resolved_datum()

  let input_value = assets.from_asset(mock_policy_id, "", 1)
  
  // Input: Dispute UTxO
  let input =
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
        value: input_value,
        datum: InlineDatum(input_datum),
        reference_script: None,
      },
    }

  // Transaction with validity range AFTER deadline
  // Deadline end is 1000. So range starting at 1001 is valid.
  let valid_range = interval.after(1001)

  let tx =
    Transaction {
      inputs: [input],
      reference_inputs: [],
      outputs: [], // Dispute NFT burned, so no output with it
      fee: 0,
      mint: assets.zero, // Should be burning, but we mock check in finalize.ak
      certificates: [],
      withdrawals: [],
      validity_range: valid_range,
      extra_signatories: [],
      redeemers: [],
      datums: dict.empty,
      id: #"0000000000000000000000000000000000000000000000000000000000000000",
      votes: [],
      proposal_procedures: [],
      current_treasury_amount: None,
      treasury_donation: None,
    }

  finalize.validate_finalize(
    tx,
    mock_policy_id,
    mock_project_nft,
    mock_profile_nft,
  )
}
