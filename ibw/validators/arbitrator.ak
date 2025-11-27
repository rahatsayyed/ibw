use cardano/address.{Credential}
use cardano/assets.{PolicyId}
use cardano/certificate.{Certificate}
use cardano/governance.{ProposalProcedure, Voter}
use cardano/transaction.{OutputReference, Transaction}

// easier to find the user-utxo with profile_nft and project_utxo with project_nft
validator arbitrator(profile_nft: PolicyId, project_nft: PolicyId) {
  mint(_redeemer: Data, _policy_id: PolicyId, _self: Transaction) {
    todo @"mint logic goes here"
  }

  spend(
    _datum: Option<Data>,
    _redeemer: Data,
    _utxo: OutputReference,
    _self: Transaction,
  ) {
    todo @"spend logic goes here"
  }

  else(_ctx: ScriptContext) {
    fail @"invalid handler called"
  }
}
