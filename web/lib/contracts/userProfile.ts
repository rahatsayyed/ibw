import {
  LucidEvolution,
  Data,
  Constr,
  fromText,
  MintingPolicy,
  SpendingValidator,
  validatorToAddress,
  paymentCredentialOf,
  getAddressDetails,
  mintingPolicyToId,
  stakeCredentialOf,
  applyDoubleCborEncoding,
  UTxO,
} from "@lucid-evolution/lucid";
import { UserProfileDatum, UserProfileRedeemer } from "@/types/contracts";
import {
  userprofile_user_profile_mint,
  userprofile_user_profile_spend,
} from "@/config/scripts/plutus";

export const registerUser = async (
  lucid: LucidEvolution,
  username: string
): Promise<string> => {
  const address = await lucid.wallet().address();
  const pkh = paymentCredentialOf(address)?.hash;
  const sc = stakeCredentialOf(address)?.hash;

  if (!pkh || !sc) throw new Error("Invalid address");

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
  console.log("network:", network);
  if (!network) throw new Error("Network not configured");

  const scriptAddress = validatorToAddress(network, spendingValidator);

  // Create Profile NFT AssetClass
  // The token name for Profile NFT is usually empty or specific.
  // Based on typical patterns, let's assume it's derived or empty.
  // Checking the contract, it often validates the token name.
  // For now, let's use the username as token name or empty.
  // Re-reading whichContract.md: "Mint unique Profile NFT (one per address)"
  // Usually unique NFTs are minted with a specific name.
  // Let's use "Profile" as token name for now, or maybe the username itself?
  // The contract says "Mint unique Profile NFT".
  // Let's assume the token name is "Profile" encoded in hex.
  const tokenName = fromText(username);
  const unit = policyId + tokenName;

  // Construct UserProfileDatum
  // We need to match the Aiken struct fields order
  /*
    user_address: Wallet, (VerificationKeyHash)
    username_hash: ByteArray,
    profile_nft: AssetClass,
    
    active_projects_as_client: 0,
    active_projects_as_freelancer: 0,
    
    total_balance: 0,
    project_collateral: 0,
    available_balance: 0,
    
    reputation_score: 0,
    total_client_completed: 0,
    total_freelancer_completed: 0,
    total_disputed: 0,
    fraud_count: 0,
    
    arbitration_score: 0,
    arbitrations_completed: 0,
    
    registered_at: POSIXTime,
  */

  const now = BigInt(Date.now());

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

  // Redeemer for minting
  // Redeemer for minting
  const mintRedeemer = Data.to(tokenName);

  const tx = await lucid
    .newTx()
    .mintAssets({ [unit]: 1n }, mintRedeemer)
    .attach.MintingPolicy(mintingPolicy)
    .pay.ToContract(
      scriptAddress,
      { kind: "inline", value: Data.to(userProfileDatum, UserProfileDatum) },
      { [unit]: 1n } // Sending the NFT to the script
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

  // Find the user's Profile NFT UTxO at the script address
  const scriptUtxos = await lucid.utxosAt(scriptAddress);
console.log("profileContract", scriptAddress)
  // Find the UTxO that belongs to this user by checking the datum
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
        // Skip UTxOs with invalid datum
        continue;
      }
    }
  }

  if (!userProfileUtxo || !currentDatum) {
    throw new Error("User profile UTxO not found");
  }

  // Create updated datum with increased balances
  const updatedDatum: UserProfileDatum = {
    ...currentDatum,
    total_balance: currentDatum.total_balance + depositAmount,
    available_balance: currentDatum.available_balance + depositAmount,
  };

  // Get the Profile NFT info
  const profileNftPolicy = currentDatum.profile_nft.policy_id;
  const profileNftName = currentDatum.profile_nft.asset_name;
  const unit = profileNftPolicy + profileNftName;

  // Create redeemer
  const redeemer: UserProfileRedeemer = {
    Deposit: { amount: depositAmount },
  };

  const tx = await lucid
    .newTx()
    .collectFrom([userProfileUtxo], Data.to(redeemer, UserProfileRedeemer))
    .pay.ToContract(
      scriptAddress,
      { kind: "inline", value: Data.to(updatedDatum, UserProfileDatum) },
      { lovelace: depositAmount,[unit]: 1n }
    )
    .attach.SpendingValidator(spendingValidator)
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

  // Find the user's Profile NFT UTxO at the script address
  const scriptUtxos = await lucid.utxosAt(scriptAddress);

  // Find the UTxO that belongs to this user by checking the datum
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
        // Skip UTxOs with invalid datum
        continue;
      }
    }
  }

  if (!userProfileUtxo || !currentDatum) {
    throw new Error("User profile UTxO not found");
  }

  // Validate sufficient balance
  if (withdrawalAmount > currentDatum.available_balance) {
    throw new Error(
      `Insufficient balance. Available: ${currentDatum.available_balance}, Requested: ${withdrawalAmount}`
    );
  }

  // Create updated datum with decreased balances
  const updatedDatum: UserProfileDatum = {
    ...currentDatum,
    total_balance: currentDatum.total_balance - withdrawalAmount,
    available_balance: currentDatum.available_balance - withdrawalAmount,
  };

  // Get the Profile NFT info
  const profileNftPolicy = currentDatum.profile_nft.policy_id;
  const profileNftName = currentDatum.profile_nft.asset_name;
  const unit = profileNftPolicy + profileNftName;

  // Create redeemer
  const redeemer: UserProfileRedeemer = {
    Withdraw: { amount: withdrawalAmount },
  };

  const tx = await lucid
    .newTx()
    .collectFrom([userProfileUtxo], Data.to(redeemer, UserProfileRedeemer))
    .pay.ToContract(
      scriptAddress,
      { kind: "inline", value: Data.to(updatedDatum, UserProfileDatum) },
      { [unit]: 1n }
    )
    .pay.ToAddress(address, { lovelace: withdrawalAmount })
    .attach.SpendingValidator(spendingValidator)
    .addSignerKey(pkh)
    .complete();

  const signedTx = await tx.sign.withWallet().complete();
  const txHash = await signedTx.submit();

  return txHash;
};
