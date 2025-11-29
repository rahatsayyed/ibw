import {
  LucidEvolution,
  Data,
  fromText,
  MintingPolicy,
  SpendingValidator,
  validatorToAddress,
  paymentCredentialOf,
  mintingPolicyToId,
  stakeCredentialOf,
  applyDoubleCborEncoding,
  UTxO,
  Script,
} from "@lucid-evolution/lucid";
import { UserProfileDatum, UserProfileRedeemer } from "@/types/contracts";
import { blockfrost } from "@/lib/cardano";
import {
  userprofile_user_profile_mint,
  userprofile_user_profile_spend,
} from "@/config/scripts/plutus";
import { supabase } from "@/lib/supabase";

const getReferenceScriptUtxo = async (
  lucid: LucidEvolution,
  scriptName: string
): Promise<UTxO> => {
  const { data, error } = await supabase
    .from("reference_scripts")
    .select("*")
    .eq("script_name", scriptName)
    .single();

  if (error || !data) {
    throw new Error(`Reference script ${scriptName} not found in database`);
  }

  const [utxo] = await lucid.utxosByOutRef([
    { txHash: data.tx_hash, outputIndex: data.output_index },
  ]);
  if (!utxo) {
    throw new Error(
      `Reference script UTxO not found on-chain: ${data.tx_hash}#${data.output_index}`
    );
  }
  return utxo;
};

export const registerUser = async (
  lucid: LucidEvolution,
  username: string
): Promise<string> => {
  const address = await lucid.wallet().address();
  const pkh = paymentCredentialOf(address)?.hash;
  const sc = stakeCredentialOf(address)?.hash;

  if (!pkh || !sc) throw new Error("Invalid address");

  // We still need the script object to derive Policy ID and Address,
  // but we won't attach it to the tx.
  const mintingPolicy: MintingPolicy = {
    type: "PlutusV3",
    script: applyDoubleCborEncoding(userprofile_user_profile_mint),
  };

  const spendingValidator: SpendingValidator = {
    type: "PlutusV3",
    script: applyDoubleCborEncoding(userprofile_user_profile_spend),
  };

  const policyId = mintingPolicyToId(mintingPolicy);
  const network = lucid.config().network;
  if (!network) throw new Error("Network not configured");

  const scriptAddress = validatorToAddress(network, spendingValidator);

  // Fetch Reference Script UTxOs
  const mintRefUtxo = await getReferenceScriptUtxo(lucid, "user_profile_mint");
  // We don't strictly need the spend ref for minting unless the minting policy interacts with the spending validator
  // in a way that requires it to be present (e.g. checking output address credential).
  // But usually for minting we just need the minting policy ref.

  const tokenName = fromText(username);
  const unit = policyId + tokenName;

  const now = await blockfrost.getLatestTime();

  const userProfileDatum: UserProfileDatum = {
    user_address: {
      pkh: pkh,
      sc: sc,
    },
    username_hash: fromText(username),
    profile_nft: {
      policy_id: policyId,
      asset_name: tokenName,
    },
    active_projects_as_client: 0n,
    active_projects_as_freelancer: 0n,
    total_balance: 0n,
    project_collateral: 0n,
    available_balance: 0n,
    reputation_score: 0n,
    total_client_completed: 0n,
    total_freelancer_completed: 0n,
    total_disputed: 0n,
    fraud_count: 0n,
    arbitration_score: 0n,
    arbitrations_completed: 0n,
    registered_at: {
      start: now,
      end: now,
    },
  };

  const mintRedeemer = Data.to(tokenName);

  const tx = await lucid
    .newTx()
    .readFrom([mintRefUtxo]) // Reference the minting policy
    .mintAssets({ [unit]: 1n }, mintRedeemer)
    // .attach.MintingPolicy(mintingPolicy) // REMOVED: Using reference script
    .pay.ToContract(
      scriptAddress,
      { kind: "inline", value: Data.to(userProfileDatum, UserProfileDatum) },
      { [unit]: 1n }
    )
    .addSignerKey(pkh)
    .complete();

  const signedTx = await tx.sign.withWallet().complete();
  const txHash = await signedTx.submit();

  return txHash;
};

export const depositFunds = async (
  lucid: LucidEvolution,
  depositAmount: bigint
): Promise<string> => {
  const address = await lucid.wallet().address();
  const pkh = paymentCredentialOf(address)?.hash;

  if (!pkh) throw new Error("Invalid address");

  const spendingValidator: SpendingValidator = {
    type: "PlutusV3",
    script: applyDoubleCborEncoding(userprofile_user_profile_spend),
  };

  const network = lucid.config().network;
  if (!network) throw new Error("Network not configured");

  const scriptAddress = validatorToAddress(network, spendingValidator);

  // Fetch Reference Script UTxO
  const spendRefUtxo = await getReferenceScriptUtxo(
    lucid,
    "user_profile_spend"
  );

  const scriptUtxos = await lucid.utxosAt(scriptAddress);

  let userProfileUtxo: UTxO | null = null;
  let currentDatum: UserProfileDatum | null = null;

  for (const utxo of scriptUtxos) {
    if (utxo.datum) {
      try {
        const datum = Data.from(utxo.datum, UserProfileDatum);
        if (datum.user_address.pkh === pkh) {
          userProfileUtxo = utxo;
          currentDatum = datum;
          break;
        }
      } catch (e) {
        continue;
      }
    }
  }

  if (!userProfileUtxo || !currentDatum) {
    throw new Error("User profile UTxO not found");
  }

  const updatedDatum: UserProfileDatum = {
    ...currentDatum,
    total_balance: currentDatum.total_balance + depositAmount,
    available_balance: currentDatum.available_balance + depositAmount,
  };

  const profileNftPolicy = currentDatum.profile_nft.policy_id;
  const profileNftName = currentDatum.profile_nft.asset_name;
  const unit = profileNftPolicy + profileNftName;

  const redeemer: UserProfileRedeemer = {
    Deposit: { amount: depositAmount },
  };

  const tx = await lucid
    .newTx()
    .readFrom([spendRefUtxo]) // Reference the spending validator
    .collectFrom([userProfileUtxo], Data.to(redeemer, UserProfileRedeemer))
    .pay.ToContract(
      scriptAddress,
      { kind: "inline", value: Data.to(updatedDatum, UserProfileDatum) },
      { lovelace: depositAmount, [unit]: 1n }
    )
    // .attach.SpendingValidator(spendingValidator) // REMOVED: Using reference script
    .addSignerKey(pkh)
    .complete();

  const signedTx = await tx.sign.withWallet().complete();
  const txHash = await signedTx.submit();

  return txHash;
};

export const withdrawFunds = async (
  lucid: LucidEvolution,
  withdrawalAmount: bigint
): Promise<string> => {
  const address = await lucid.wallet().address();
  const pkh = paymentCredentialOf(address)?.hash;

  if (!pkh) throw new Error("Invalid address");

  const spendingValidator: SpendingValidator = {
    type: "PlutusV3",
    script: applyDoubleCborEncoding(userprofile_user_profile_spend),
  };

  const network = lucid.config().network;
  if (!network) throw new Error("Network not configured");

  const scriptAddress = validatorToAddress(network, spendingValidator);

  // Fetch Reference Script UTxO
  const spendRefUtxo = await getReferenceScriptUtxo(
    lucid,
    "user_profile_spend"
  );

  const scriptUtxos = await lucid.utxosAt(scriptAddress);

  let userProfileUtxo: UTxO | null = null;
  let currentDatum: UserProfileDatum | null = null;

  for (const utxo of scriptUtxos) {
    if (utxo.datum) {
      try {
        const datum = Data.from(utxo.datum, UserProfileDatum);
        if (datum.user_address.pkh === pkh) {
          userProfileUtxo = utxo;
          currentDatum = datum;
          break;
        }
      } catch (e) {
        continue;
      }
    }
  }

  if (!userProfileUtxo || !currentDatum) {
    throw new Error("User profile UTxO not found");
  }

  if (withdrawalAmount > currentDatum.available_balance) {
    throw new Error(
      `Insufficient balance. Available: ${currentDatum.available_balance}, Requested: ${withdrawalAmount}`
    );
  }

  const updatedDatum: UserProfileDatum = {
    ...currentDatum,
    total_balance: currentDatum.total_balance - withdrawalAmount,
    available_balance: currentDatum.available_balance - withdrawalAmount,
  };

  const profileNftPolicy = currentDatum.profile_nft.policy_id;
  const profileNftName = currentDatum.profile_nft.asset_name;
  const unit = profileNftPolicy + profileNftName;

  const redeemer: UserProfileRedeemer = {
    Withdraw: { amount: withdrawalAmount },
  };

  const tx = await lucid
    .newTx()
    .readFrom([spendRefUtxo]) // Reference the spending validator
    .collectFrom([userProfileUtxo], Data.to(redeemer, UserProfileRedeemer))
    .pay.ToContract(
      scriptAddress,
      { kind: "inline", value: Data.to(updatedDatum, UserProfileDatum) },
      { [unit]: 1n }
    )
    .pay.ToAddress(address, { lovelace: withdrawalAmount })
    // .attach.SpendingValidator(spendingValidator) // REMOVED: Using reference script
    .addSignerKey(pkh)
    .complete();

  const signedTx = await tx.sign.withWallet().complete();
  const txHash = await signedTx.submit();

  return txHash;
};
