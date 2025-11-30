import { Data } from "@lucid-evolution/lucid";

// ================AssetClass================
export const AssetClassSchema = Data.Object({
  policy_id: Data.Bytes(),
  asset_name: Data.Bytes(),
});
export type AssetClass = Data.Static<typeof AssetClassSchema>;
export const AssetClass = AssetClassSchema as unknown as AssetClass;

// ================Moment================
export const MomentSchema = Data.Object({
  start: Data.Integer(),
  end: Data.Integer(),
});
export type Moment = Data.Static<typeof MomentSchema>;
export const Moment = MomentSchema as unknown as Moment;

// ================Wallet================
export const WalletSchema = Data.Object({
  pkh: Data.Bytes(),
  sc: Data.Bytes(),
});
export type Wallet = Data.Static<typeof WalletSchema>;
export const Wallet = WalletSchema as unknown as Wallet;

// ================UserProfileDatum================
export const UserProfileDatumSchema = Data.Object({
  user_address: WalletSchema,
  username_hash: Data.Bytes(),
  profile_nft: AssetClassSchema,

  active_projects_as_client: Data.Integer(),
  active_projects_as_freelancer: Data.Integer(),

  total_balance: Data.Integer(),
  project_collateral: Data.Integer(),
  available_balance: Data.Integer(),

  reputation_score: Data.Integer(),
  total_client_completed: Data.Integer(),
  total_freelancer_completed: Data.Integer(),
  total_disputed: Data.Integer(),
  fraud_count: Data.Integer(),

  arbitration_score: Data.Integer(),
  arbitrations_completed: Data.Integer(),

  registered_at: MomentSchema,
});

export type UserProfileDatum = Data.Static<typeof UserProfileDatumSchema>;
export const UserProfileDatum =
  UserProfileDatumSchema as unknown as UserProfileDatum;

// ================UserProfileRedeemer================
export const UserProfileRedeemerSchema = Data.Enum([
  Data.Object({
    Deposit: Data.Object({
      amount: Data.Integer(),
    }),
  }),
  Data.Object({
    Withdraw: Data.Object({
      amount: Data.Integer(),
    }),
  }),
  Data.Literal("ProjectCreate"),
  Data.Literal("ProjectAccept"),
  Data.Literal("ProjectSubmit"),
  Data.Literal("ProjectApproval"),
  Data.Literal("ProjectDispute"),
]);

export type UserProfileRedeemer = Data.Static<typeof UserProfileRedeemerSchema>;
export const UserProfileRedeemer =
  UserProfileRedeemerSchema as unknown as UserProfileRedeemer;

// ================ProjectStatus================
export const ProjectStatusSchema = Data.Enum([
  Data.Literal("Open"),
  Data.Literal("Accepted"),
  Data.Literal("Submitted"),
  Data.Literal("Disputed"),
  Data.Literal("Completed"),
]);
export type ProjectStatus = Data.Static<typeof ProjectStatusSchema>;
export const ProjectStatus = ProjectStatusSchema as unknown as ProjectStatus;

// ================ProjectDatum================
export const ProjectDatumSchema = Data.Object({
  project_id: Data.Bytes(),
  project_nft: AssetClassSchema,
  client_nft: AssetClassSchema,
  freelancer_nft: Data.Nullable(AssetClassSchema),
  project_amount: Data.Integer(),
  collateral_rate: Data.Integer(),
  minimum_completion_percentage: Data.Integer(),
  description_hash: Data.Bytes(),
  success_criteria_hash: Data.Bytes(),
  github_repo_hash: Data.Bytes(),
  metadata_url: Data.Bytes(),
  status: ProjectStatusSchema,
  created_at: MomentSchema,
  completion_deadline: MomentSchema,
  submission_details_hash: Data.Nullable(Data.Bytes()),
  submission_time: Data.Nullable(MomentSchema),
  dispute_nft: Data.Nullable(AssetClassSchema),
});
export type ProjectDatum = Data.Static<typeof ProjectDatumSchema>;
export const ProjectDatum = ProjectDatumSchema as unknown as ProjectDatum;

// ================ProjectRedeemer================
export const ProjectRedeemerSchema = Data.Enum([
  Data.Literal("ProjectAccept"),
  Data.Literal("ProjectSubmit"),
  Data.Literal("ProjectApproval"),
  Data.Literal("ProjectDispute"),
  Data.Literal("ProjectReDispute"),
  Data.Literal("ProjectFinalize"),
]);
export type ProjectRedeemer = Data.Static<typeof ProjectRedeemerSchema>;
export const ProjectRedeemer =
  ProjectRedeemerSchema as unknown as ProjectRedeemer;

// ================ProjectMintRedeemer================
export const ProjectMintRedeemerSchema = Data.Enum([
  Data.Literal("Create"),
  Data.Literal("Burn"),
]);
export type ProjectMintRedeemer = Data.Static<typeof ProjectMintRedeemerSchema>;
export const ProjectMintRedeemer =
  ProjectMintRedeemerSchema as unknown as ProjectMintRedeemer;

// ================DisputeState================
export const DisputeStateSchema = Data.Enum([
  Data.Literal("Pending"),
  Data.Literal("AIResolved"),
  Data.Literal("HumanReview"),
  Data.Literal("Resolved"),
]);
export type DisputeState = Data.Static<typeof DisputeStateSchema>;
export const DisputeState = DisputeStateSchema as unknown as DisputeState;

// ================DisputeDatum================
export const DisputeDatumSchema = Data.Object({
  ai_agent_id: Data.Nullable(Data.Bytes()),
  ai_decision: Data.Nullable(Data.Bytes()),
  completion_percentage: Data.Nullable(Data.Integer()),
  ai_confidence: Data.Nullable(Data.Integer()),
  ai_analysis_hash: Data.Nullable(Data.Bytes()),
  re_dispute_deadline: Data.Nullable(MomentSchema),
  state: DisputeStateSchema,
  re_dispute_requested: Data.Boolean(),
  re_dispute_reason_hash: Data.Nullable(Data.Bytes()),
  arbitrator_nft: Data.Nullable(AssetClassSchema),
  final_decision: Data.Nullable(Data.Bytes()),
  final_completion_percentage: Data.Nullable(Data.Integer()),
  resolved_at: Data.Nullable(MomentSchema),
});
export type DisputeDatum = Data.Static<typeof DisputeDatumSchema>;
export const DisputeDatum = DisputeDatumSchema as unknown as DisputeDatum;

// ================ArbitratorMintRedeemer================
export const ArbitratorMintRedeemerSchema = Data.Enum([
  Data.Literal("DisputeProject"),
  Data.Literal("NoRedispute"),
  Data.Literal("HumanArbitration"),
]);
export type ArbitratorMintRedeemer = Data.Static<
  typeof ArbitratorMintRedeemerSchema
>;
export const ArbitratorMintRedeemer =
  ArbitratorMintRedeemerSchema as unknown as ArbitratorMintRedeemer;
