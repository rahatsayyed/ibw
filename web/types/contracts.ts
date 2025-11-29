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
