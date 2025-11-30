use aiken/collection/list
use aiken/option
use cardano/address.{Address}
use cardano/assets.{PolicyId}
use cardano/transaction.{InlineDatum, Transaction}
use types/types.{
  AssetClass, DisputeDatum, ProjectDatum, UserProfileDatum,
}

pub fn validate_profile_resolve(
  tx: Transaction,
  input_datum: UserProfileDatum,
  output_datum: UserProfileDatum,
  project_input_index: Int,
  dispute_input_index: Int,
  _profile_nft_policy: PolicyId,
  _profile_nft_name: ByteArray,
  _script_address: Address,
) -> Bool {
  // 1. Get Project Input & Datum
  expect Some(project_input) = list.at(tx.inputs, project_input_index)
  expect InlineDatum(p_datum) = project_input.output.datum
  expect project_datum: ProjectDatum = p_datum

  // 2. Get Dispute Input & Datum
  expect Some(dispute_input) = list.at(tx.inputs, dispute_input_index)
  expect InlineDatum(d_datum) = dispute_input.output.datum
  expect dispute_datum: DisputeDatum = d_datum

  // 3. Identify Role and Validate Updates
  let my_profile_nft = input_datum.profile_nft
  
  if my_profile_nft == project_datum.client_nft {
      // Client Updates
      // ----------------
      // - active_projects_as_client -= 1
      // - project_collateral -= 25_000_000 (released)
      
      let active_check = 
        output_datum.active_projects_as_client == input_datum.active_projects_as_client - 1
        
      let collateral_check = 
        output_datum.project_collateral == input_datum.project_collateral - 25_000_000
      
      // TODO: Verify total_balance update based on dispute result (payout)
      
      active_check? && collateral_check?
  } else if Some(my_profile_nft) == project_datum.freelancer_nft {
      // Freelancer Updates
      // --------------------
      // - active_projects_as_freelancer -= 1
      
      let active_check = 
        output_datum.active_projects_as_freelancer == input_datum.active_projects_as_freelancer - 1
        
      // TODO: Verify total_balance update based on dispute result (payout)
      
      active_check?
  } else if Some(my_profile_nft) == dispute_datum.arbitrator_nft {
      // Arbitrator Updates
      // -------------------
      // - arbitrations_completed += 1
      
      let completed_check = 
        output_datum.arbitrations_completed == input_datum.arbitrations_completed + 1
      
      // TODO: Verify total_balance update (Arbitrator Fee)
      
      completed_check?
  } else {
      // Not involved in this dispute
      False
  }
}
