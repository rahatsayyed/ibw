use aiken/option
use cardano/assets.{AssetName, PolicyId}
use types/moment.{Moment}
use types/wallet.{Wallet}

// Define AssetClass since it doesn't exist in stdlib
pub type AssetClass {
  policy_id: PolicyId,
  asset_name: AssetName,
}

pub type UserProfileDatum {
  user_address: Wallet,
  username_hash: ByteArray,
  profile_nft: AssetClass,
  active_projects_as_client: Int,
  active_projects_as_freelancer: Int,
  total_balance: Int,
  project_collateral: Int,
  available_balance: Int,
  reputation_score: Int,
  total_client_completed: Int,
  total_freelancer_completed: Int,
  total_disputed: Int,
  fraud_count: Int,
  arbitration_score: Int,
  arbitrations_completed: Int,
  registered_at: Moment,
}

pub type ProjectStatus {
  Open
  Accepted
  Submitted
  Disputed
  Completed
}

pub type ProjectDatum {
  project_id: ByteArray,
  project_nft: AssetClass,
  client_nft: AssetClass,
  freelancer_nft: Option<AssetClass>,
  project_amount: Int,
  collateral_rate: Int,
  minimum_completion_percentage: Int,
  description_hash: ByteArray,
  success_criteria_hash: ByteArray,
  github_repo_hash: ByteArray,
  metadata_url: ByteArray,
  status: ProjectStatus,
  created_at: Moment,
  completion_deadline: Moment,
  submission_details_hash: Option<ByteArray>,
  submission_time: Option<Moment>,
  dispute_nft: Option<AssetClass>,
}

pub type DisputeState {
  Pending
  AIResolved
  HumanReview
  Resolved
}

pub type DisputeDatum {
  ai_agent_id: Option<ByteArray>,
  ai_decision: Option<ByteArray>,
  completion_percentage: Option<Int>,
  ai_confidence: Option<Int>,
  ai_analysis_hash: Option<ByteArray>,
  re_dispute_deadline: Option<Moment>,
  state: DisputeState,
  re_dispute_requested: Bool,
  re_dispute_reason_hash: Option<ByteArray>,
  arbitrator_nft: Option<AssetClass>,
  final_decision: Option<ByteArray>,
  final_completion_percentage: Option<Int>,
  resolved_at: Option<Moment>,
}

pub type ProjectRedeemer {
  ProjectAccept
  ProjectSubmit
  ProjectApproval
  ProjectDispute
  ProjectReDispute
  ProjectFinalize
}

pub type ArbitratorMintRedeemer {
  DisputeProject
  NoRedispute
  HumanArbitration
}

pub type ArbitratorRedeemer {
  AIResolve
  ReDispute
  Finalize
}
