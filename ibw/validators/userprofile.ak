use cardano/address.{Credential}
use cardano/assets.{PolicyId}
use cardano/certificate.{Certificate}
use cardano/governance.{ProposalProcedure, Voter}
use cardano/transaction.{OutputReference, Transaction}

validator user_profile {
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
