import {
  applyDoubleCborEncoding,
  applyParamsToScript,
  Data,
  fromText,
  LucidEvolution,
  MintingPolicy,
  mintingPolicyToId,
  paymentCredentialOf,
  SpendingValidator,
  validatorToAddress,
} from "@lucid-evolution/lucid";
import {
  project_project_contract_mint,
  project_project_contract_spend,
  userprofile_user_profile_mint,
  userprofile_user_profile_spend,
} from "@/config/scripts/plutus";
import {
  ProjectDatum,
  ProjectMintRedeemer,
  ProjectRedeemer,
  UserProfileDatum,
  UserProfileRedeemer,
} from "@/types/contracts";

export const createProject = async (
  lucid: LucidEvolution,
  projectData: {
    title: string;
    description: string;
    criteria: string;
    repo_url: string;
    payment_amount: bigint;
    collateral_rate: bigint;
    min_completion_percentage: bigint;
    deadline: Date;
    metadata_url: string;
  }
): Promise<{ txHash: string; projectNftName: string }> => {
  const address = await lucid.wallet().address();
  const pkh = paymentCredentialOf(address)?.hash;

  if (!pkh) throw new Error("Invalid address");

  const network = lucid.config().network;
  if (!network) throw new Error("Network not configured");

  // 1. Get User Profile NFT
  const profileMintingPolicy: MintingPolicy = {
    type: "PlutusV3",
    script: applyDoubleCborEncoding(userprofile_user_profile_mint),
  };
  const profilePolicyId = mintingPolicyToId(profileMintingPolicy);

  const profileSpendingValidator: SpendingValidator = {
    type: "PlutusV3",
    script: applyDoubleCborEncoding(userprofile_user_profile_spend),
  };
  const profileScriptAddress = validatorToAddress(
    network,
    profileSpendingValidator
  );

  const utxos = await lucid.utxosAt(profileScriptAddress);
  const userProfileUtxo = utxos.find((utxo) => {
    try {
      const datum = Data.from(utxo.datum!, UserProfileDatum);
      return datum.user_address.pkh === pkh;
    } catch (e) {
      return false;
    }
  });

  if (!userProfileUtxo) throw new Error("User profile not found");

  const userProfileDatum = Data.from(userProfileUtxo.datum!, UserProfileDatum);

  // 2. Prepare Project Scripts (parameterized by Profile NFT Policy ID)
  const projectMintingScript = applyParamsToScript(
    applyDoubleCborEncoding(project_project_contract_mint),
    [profilePolicyId]
  );
  const projectMintingPolicy: MintingPolicy = {
    type: "PlutusV3",
    script: projectMintingScript,
  };
  const projectPolicyId = mintingPolicyToId(projectMintingPolicy);

  const projectSpendingScript = applyParamsToScript(
    applyDoubleCborEncoding(project_project_contract_spend),
    [profilePolicyId]
  );
  const projectSpendingValidator: SpendingValidator = {
    type: "PlutusV3",
    script: projectSpendingScript,
  };
  const projectScriptAddress = validatorToAddress(
    network,
    projectSpendingValidator
  );

  // 3. Construct Project Datum
  // Use a unique token name for the project NFT.
  // We can use the transaction hash + index of the input, but here we'll just use a random name or derived from title for simplicity in this context,
  // but ideally it should be unique. The validator checks uniqueness by ensuring only 1 is minted.
  // Let's use a timestamp + random suffix for uniqueness.
  const tokenName = fromText(
    "PRJ" + Date.now().toString().slice(-8) + Math.floor(Math.random() * 1000)
  );
  const unit = projectPolicyId + tokenName;

  const now = BigInt(Date.now());
  const deadline = BigInt(projectData.deadline.getTime());

  const projectDatum: ProjectDatum = {
    project_id: tokenName, // Using token name as ID
    project_nft: {
      policy_id: projectPolicyId,
      asset_name: tokenName,
    },
    client_nft: {
      policy_id: profilePolicyId,
      asset_name: userProfileDatum.profile_nft.asset_name,
    },
    freelancer_nft: null,
    project_amount: projectData.payment_amount,
    collateral_rate: projectData.collateral_rate,
    minimum_completion_percentage: projectData.min_completion_percentage,
    description_hash: fromText(projectData.description.slice(0, 32)), // Mock hash
    success_criteria_hash: fromText(projectData.criteria.slice(0, 32)), // Mock hash
    github_repo_hash: fromText(projectData.repo_url.slice(0, 32)), // Mock hash
    metadata_url: fromText(projectData.metadata_url),
    status: "Open",
    created_at: { start: now, end: now },
    completion_deadline: { start: deadline, end: deadline },
    submission_details_hash: null,
    submission_time: null,
    dispute_nft: null,
  };

  // 4. Build Transaction
  const tx = await lucid
    .newTx()
    // Mint Project NFT
    .mintAssets({ [unit]: 1n }, Data.to("Create", ProjectMintRedeemer))
    .attach.MintingPolicy(projectMintingPolicy)
    // Pay to Project Script
    .pay.ToContract(
      projectScriptAddress,
      { kind: "inline", value: Data.to(projectDatum, ProjectDatum) },
      { [unit]: 1n, lovelace: projectData.payment_amount } // Lock payment + NFT
    )
    // Consume Client Profile NFT (to prove ownership and satisfy validator)
    // We must return it back to the profile script
    .collectFrom(
      [userProfileUtxo],
      Data.to("ProjectCreate", UserProfileRedeemer)
    )
    // We need to update `active_projects_as_client`.

    .pay.ToContract(
      profileScriptAddress,
      {
        kind: "inline",
        value: Data.to(
          {
            ...userProfileDatum,
            active_projects_as_client:
              userProfileDatum.active_projects_as_client + 1n,
            project_collateral:
              userProfileDatum.project_collateral + 25_000_000n,
            available_balance:
              userProfileDatum.available_balance -
              25_000_000n,
          },
          UserProfileDatum
        ),
      },
      userProfileUtxo.assets // Return same assets (Profile NFT)
    )
    .attach.SpendingValidator(profileSpendingValidator)
    .addSignerKey(pkh)
    .complete();

  const signedTx = await tx.sign.withWallet().complete();
  const txHash = await signedTx.submit();

  return { txHash, projectNftName: tokenName };
};

export const acceptProject = async (
  lucid: LucidEvolution,
  projectNftAssetName: string,
  collateralAmount: bigint
): Promise<string> => {
  const address = await lucid.wallet().address();
  const pkh = paymentCredentialOf(address)?.hash;

  if (!pkh) throw new Error("Invalid address");

  const network = lucid.config().network;
  if (!network) throw new Error("Network not configured");

  // 1. Get Freelancer Profile NFT
  const profileMintingPolicy: MintingPolicy = {
    type: "PlutusV3",
    script: applyDoubleCborEncoding(userprofile_user_profile_mint),
  };
  const profilePolicyId = mintingPolicyToId(profileMintingPolicy);

  const profileSpendingValidator: SpendingValidator = {
    type: "PlutusV3",
    script: applyDoubleCborEncoding(userprofile_user_profile_spend),
  };
  const profileScriptAddress = validatorToAddress(
    network,
    profileSpendingValidator
  );

  const profileUtxos = await lucid.utxosAt(profileScriptAddress);
  const freelancerProfileUtxo = profileUtxos.find((utxo) => {
    try {
      const datum = Data.from(utxo.datum!, UserProfileDatum);
      return datum.user_address.pkh === pkh;
    } catch (e) {
      return false;
    }
  });

  if (!freelancerProfileUtxo) throw new Error("Freelancer profile not found");

  const freelancerProfileDatum = Data.from(
    freelancerProfileUtxo.datum!,
    UserProfileDatum
  );

  // 2. Get Project UTxO
  const projectSpendingScript = applyParamsToScript(
    applyDoubleCborEncoding(project_project_contract_spend),
    [profilePolicyId]
  );
  const projectSpendingValidator: SpendingValidator = {
    type: "PlutusV3",
    script: projectSpendingScript,
  };
  const projectScriptAddress = validatorToAddress(
    network,
    projectSpendingValidator
  );

  const projectMintingScript = applyParamsToScript(
    applyDoubleCborEncoding(project_project_contract_mint),
    [profilePolicyId]
  );
  const projectMintingPolicy: MintingPolicy = {
    type: "PlutusV3",
    script: projectMintingScript,
  };
  const projectPolicyId = mintingPolicyToId(projectMintingPolicy);

  const projectUtxos = await lucid.utxosAt(projectScriptAddress);
  const projectUtxo = projectUtxos.find((utxo) =>
    Object.keys(utxo.assets).some(
      (unit) =>
        unit.startsWith(projectPolicyId) && unit.endsWith(projectNftAssetName)
    )
  );

  if (!projectUtxo) throw new Error("Project not found");

  const currentProjectDatum = Data.from(projectUtxo.datum!, ProjectDatum);

  // 3. Update Project Datum
  const updatedProjectDatum: ProjectDatum = {
    ...currentProjectDatum,
    freelancer_nft: {
      policy_id: profilePolicyId,
      asset_name: freelancerProfileDatum.profile_nft.asset_name,
    },
    status: "Accepted",
  };
  // ProjectCollateral
  const projectCollateral =
    (currentProjectDatum.project_amount * 100n) /
    currentProjectDatum.collateral_rate;

  // 4. Build Transaction
  const tx = await lucid
    .newTx()
    // Consume Project UTxO
    .collectFrom([projectUtxo], Data.to("Accept", ProjectRedeemer))
    .attach.SpendingValidator(projectSpendingValidator)
    // Pay back to Project Script with updated datum and collateral
    .pay.ToContract(
      projectScriptAddress,
      { kind: "inline", value: Data.to(updatedProjectDatum, ProjectDatum) },
      {
        ...projectUtxo.assets,
        lovelace: projectUtxo.assets.lovelace + collateralAmount,
      }
    )
    // Consume Freelancer Profile NFT (to prove ownership)
    // We assume we need to update freelancer stats (e.g. active_projects_as_freelancer)
    // But for now, let's just return it.
    // We need a redeemer for UserProfile. "ProjectCreate" might not be appropriate.
    // Let's check UserProfileRedeemer again. It has Deposit, Withdraw, ProjectCreate.
    // Maybe "ProjectCreate" is reused for "ProjectJoin" or we need a new one?
    // Or maybe we just use "ProjectCreate" as a generic "Update State" for projects?
    // Let's assume "ProjectCreate" is fine or we use a void redeemer if allowed (unlikely).
    // Actually, looking at `userprofile.ak`, `ProjectCreate` allows updating `active_projects`.
    // So we should increment `active_projects_as_freelancer`.
    .collectFrom(
      [freelancerProfileUtxo],
      Data.to("ProjectCreate", UserProfileRedeemer)
    )
    .pay.ToContract(
      profileScriptAddress,
      {
        kind: "inline",
        value: Data.to(
          {
            ...freelancerProfileDatum,
            active_projects_as_freelancer:
              freelancerProfileDatum.active_projects_as_freelancer + 1n,
            project_collateral:
              freelancerProfileDatum.project_collateral + projectCollateral,
            available_balance:
              freelancerProfileDatum.available_balance - projectCollateral,
          },
          UserProfileDatum
        ),
      },
      freelancerProfileUtxo.assets
    )
    .addSignerKey(pkh)
    .complete();

  const signedTx = await tx.sign.withWallet().complete();
  const txHash = await signedTx.submit();

  return txHash;
};
