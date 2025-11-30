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
  UTxO,
  Script,
} from "@lucid-evolution/lucid";
import {
  project_project_contract_mint,
  project_project_contract_spend,
  userprofile_user_profile_mint,
  userprofile_user_profile_spend,
  arbitrator_arbitrator_mint,
  arbitrator_arbitrator_spend,
} from "@/config/scripts/plutus";
import {
  ProjectDatum,
  ProjectMintRedeemer,
  ProjectRedeemer,
  UserProfileDatum,
  UserProfileRedeemer,
  DisputeDatum,
  DisputeState,
  ArbitratorMintRedeemer,
  ArbitratorRedeemer,
} from "@/types/contracts";
import { blockfrost } from "@/lib/cardano";
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
  const now = await blockfrost.getLatestTime();
  const tokenName = fromText(
    "PRJ" + now.toString().slice(-8) + Math.floor(Math.random() * 1000)
  );
  const unit = projectPolicyId + tokenName;

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

  // 4. Fetch Reference Scripts
  const profileSpendRefUtxo = await getReferenceScriptUtxo(
    lucid,
    "user_profile"
  );

  // 4. Build Transaction
  const tx = await lucid
    .newTx()
    // Mint Project NFT (still attach policy as it's one-time use)
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
            available_balance: userProfileDatum.available_balance - 25_000_000n,
          },
          UserProfileDatum
        ),
      },
      userProfileUtxo.assets // Return same assets (Profile NFT)
    )
    .readFrom([profileSpendRefUtxo]) // Use reference script
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
  // collateral_rate is a percentage (e.g. 5 means 5%)
  const projectCollateral =
    (currentProjectDatum.project_amount * currentProjectDatum.collateral_rate) /
    100n;

  if (freelancerProfileDatum.available_balance < projectCollateral) {
    throw new Error(
      `Insufficient available balance for collateral. Required: ${projectCollateral}, Available: ${freelancerProfileDatum.available_balance}`
    );
  }

  // 4. Fetch Reference Scripts
  const projectSpendRefUtxo = await getReferenceScriptUtxo(lucid, "project");
  const profileSpendRefUtxo = await getReferenceScriptUtxo(
    lucid,
    "user_profile"
  );

  // 5. Build Transaction
  const tx = await lucid
    .newTx()
    // Consume Project UTxO
    .collectFrom([projectUtxo], Data.to("ProjectAccept", ProjectRedeemer))
    // Pay back to Project Script with updated datum and collateral
    .pay.ToContract(
      projectScriptAddress,
      { kind: "inline", value: Data.to(updatedProjectDatum, ProjectDatum) },
      {
        ...projectUtxo.assets,
        lovelace: projectUtxo.assets.lovelace,
      }
    )
    // Consume Freelancer Profile NFT (to prove ownership)
    .collectFrom(
      [freelancerProfileUtxo],
      Data.to("ProjectAccept", UserProfileRedeemer)
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
    .readFrom([projectSpendRefUtxo, profileSpendRefUtxo]) // Use reference scripts
    .addSignerKey(pkh)
    .complete();

  const signedTx = await tx.sign.withWallet().complete();
  const txHash = await signedTx.submit();

  return txHash;
};

export const submitProject = async (
  lucid: LucidEvolution,
  projectNftAssetName: string,
  submissionDetails: string
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
  const now = await blockfrost.getLatestTime();
  const updatedProjectDatum: ProjectDatum = {
    ...currentProjectDatum,
    status: "Submitted",
    submission_details_hash: fromText(submissionDetails), // In real app, this might be IPFS hash
    submission_time: { start: now, end: now },
  };

  // 4. Fetch Reference Scripts
  const projectSpendRefUtxo = await getReferenceScriptUtxo(lucid, "project");
  const profileSpendRefUtxo = await getReferenceScriptUtxo(
    lucid,
    "user_profile"
  );

  // 5. Build Transaction
  const tx = await lucid
    .newTx()
    // Consume Project UTxO
    .collectFrom([projectUtxo], Data.to("ProjectSubmit", ProjectRedeemer))
    // Pay back to Project Script with updated datum
    .pay.ToContract(
      projectScriptAddress,
      { kind: "inline", value: Data.to(updatedProjectDatum, ProjectDatum) },
      {
        ...projectUtxo.assets,
        lovelace: projectUtxo.assets.lovelace,
      }
    )
    // Consume Freelancer Profile NFT (to prove ownership and satisfy validator)
    .collectFrom(
      [freelancerProfileUtxo],
      Data.to("ProjectSubmit", UserProfileRedeemer)
    )
    .pay.ToContract(
      profileScriptAddress,
      {
        kind: "inline",
        value: Data.to(freelancerProfileDatum, UserProfileDatum), // No changes to profile stats yet
      },
      freelancerProfileUtxo.assets
    )
    .readFrom([projectSpendRefUtxo, profileSpendRefUtxo]) // Use reference scripts
    .addSignerKey(pkh)
    .complete();

  const signedTx = await tx.sign.withWallet().complete();
  const txHash = await signedTx.submit();

  return txHash;
};

export const approveProject = async (
  lucid: LucidEvolution,
  projectNftAssetName: string
): Promise<string> => {
  const address = await lucid.wallet().address();
  const pkh = paymentCredentialOf(address)?.hash;

  if (!pkh) throw new Error("Invalid address");

  const network = lucid.config().network;
  if (!network) throw new Error("Network not configured");

  // 1. Get Client Profile NFT (Caller)
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
  const clientProfileUtxo = profileUtxos.find((utxo) => {
    try {
      const datum = Data.from(utxo.datum!, UserProfileDatum);
      return datum.user_address.pkh === pkh;
    } catch (e) {
      return false;
    }
  });

  if (!clientProfileUtxo) throw new Error("Client profile not found");

  const clientProfileDatum = Data.from(
    clientProfileUtxo.datum!,
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

  // 3. Get Freelancer Profile NFT
  // We need to find the freelancer's profile to update it.
  // We can find it by looking for the freelancer_nft specified in the project datum.
  if (!currentProjectDatum.freelancer_nft) {
    throw new Error("No freelancer assigned to this project");
  }

  const freelancerNftUnit =
    currentProjectDatum.freelancer_nft.policy_id +
    currentProjectDatum.freelancer_nft.asset_name;

  const freelancerProfileUtxo = profileUtxos.find((utxo) =>
    Object.keys(utxo.assets).includes(freelancerNftUnit)
  );

  if (!freelancerProfileUtxo) throw new Error("Freelancer profile not found");

  const freelancerProfileDatum = Data.from(
    freelancerProfileUtxo.datum!,
    UserProfileDatum
  );

  // 4. Update Client Datum
  const updatedClientDatum: UserProfileDatum = {
    ...clientProfileDatum,
    active_projects_as_client:
      clientProfileDatum.active_projects_as_client - 1n,
    project_collateral: clientProfileDatum.project_collateral - 25_000_000n,
    total_client_completed: clientProfileDatum.total_client_completed + 1n,
    reputation_score: clientProfileDatum.reputation_score + 5n,
    available_balance: clientProfileDatum.available_balance + 25_000_000n,
  };

  // 5. Update Freelancer Datum
  const projectCollateral =
    (currentProjectDatum.project_amount * 100n) /
    currentProjectDatum.collateral_rate;

  const updatedFreelancerDatum: UserProfileDatum = {
    ...freelancerProfileDatum,
    active_projects_as_freelancer:
      freelancerProfileDatum.active_projects_as_freelancer - 1n,
    project_collateral:
      freelancerProfileDatum.project_collateral - projectCollateral, // Assuming collateral is returned to available
    available_balance:
      freelancerProfileDatum.available_balance +
      currentProjectDatum.project_amount +
      projectCollateral,
    total_freelancer_completed:
      freelancerProfileDatum.total_freelancer_completed + 1n,
    reputation_score: freelancerProfileDatum.reputation_score + 10n,
    total_balance:
      freelancerProfileDatum.total_balance + currentProjectDatum.project_amount,
  };

  // 6. Fetch Reference Scripts
  const projectSpendRefUtxo = await getReferenceScriptUtxo(lucid, "project");
  const profileSpendRefUtxo = await getReferenceScriptUtxo(
    lucid,
    "user_profile"
  );

  // 7. Build Transaction
  const tx = await lucid
    .newTx()
    // Consume Project UTxO (Redeemer: Approve)
    .collectFrom([projectUtxo], Data.to("ProjectApproval", ProjectRedeemer))
    // Consume Client Profile UTxO
    .collectFrom(
      [clientProfileUtxo],
      Data.to("ProjectApproval", UserProfileRedeemer)
    )
    // Consume Freelancer Profile UTxO
    .collectFrom(
      [freelancerProfileUtxo],
      Data.to("ProjectApproval", UserProfileRedeemer)
    )
    // Output Updated Client Profile
    .pay.ToContract(
      profileScriptAddress,
      { kind: "inline", value: Data.to(updatedClientDatum, UserProfileDatum) },
      clientProfileUtxo.assets
    )
    // Output Updated Freelancer Profile + Project Amount
    .pay.ToContract(
      profileScriptAddress,
      {
        kind: "inline",
        value: Data.to(updatedFreelancerDatum, UserProfileDatum),
      },
      {
        ...freelancerProfileUtxo.assets,
        lovelace:
          freelancerProfileUtxo.assets.lovelace +
          currentProjectDatum.project_amount,
      }
    )
    .readFrom([projectSpendRefUtxo, profileSpendRefUtxo]) // Use reference scripts
    .addSignerKey(pkh)
    .complete();

  const signedTx = await tx.sign.withWallet().complete();
  const txHash = await signedTx.submit();

  return txHash;
};

export const raiseDispute = async (
  lucid: LucidEvolution,
  projectNftAssetName: string
): Promise<string> => {
  const address = await lucid.wallet().address();
  const pkh = paymentCredentialOf(address)?.hash;

  if (!pkh) throw new Error("Invalid address");

  const network = lucid.config().network;
  if (!network) throw new Error("Network not configured");

  // 1. Get Caller's Profile NFT
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
  const callerProfileUtxo = profileUtxos.find((utxo) => {
    try {
      const datum = Data.from(utxo.datum!, UserProfileDatum);
      return datum.user_address.pkh === pkh;
    } catch (e) {
      return false;
    }
  });

  if (!callerProfileUtxo) throw new Error("Caller profile not found");

  const callerProfileDatum = Data.from(
    callerProfileUtxo.datum!,
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

  // 3. Identify Client and Freelancer Profiles
  const clientNftUnit =
    currentProjectDatum.client_nft.policy_id +
    currentProjectDatum.client_nft.asset_name;

  if (!currentProjectDatum.freelancer_nft) {
    throw new Error("Project has no freelancer assigned");
  }
  const freelancerNftUnit =
    currentProjectDatum.freelancer_nft.policy_id +
    currentProjectDatum.freelancer_nft.asset_name;

  const clientProfileUtxo = profileUtxos.find((utxo) =>
    Object.keys(utxo.assets).includes(clientNftUnit)
  );
  const freelancerProfileUtxo = profileUtxos.find((utxo) =>
    Object.keys(utxo.assets).includes(freelancerNftUnit)
  );

  if (!clientProfileUtxo || !freelancerProfileUtxo) {
    throw new Error("Client or Freelancer profile not found");
  }

  const clientProfileDatum = Data.from(
    clientProfileUtxo.datum!,
    UserProfileDatum
  );
  const freelancerProfileDatum = Data.from(
    freelancerProfileUtxo.datum!,
    UserProfileDatum
  );

  // 4. Prepare Arbitrator Script
  const arbitratorMintingScript = applyParamsToScript(
    applyDoubleCborEncoding(arbitrator_arbitrator_mint),
    [profilePolicyId, projectPolicyId]
  );
  const arbitratorMintingPolicy: MintingPolicy = {
    type: "PlutusV3",
    script: arbitratorMintingScript,
  };
  const arbitratorPolicyId = mintingPolicyToId(arbitratorMintingPolicy);

  const arbitratorSpendingScript = applyParamsToScript(
    applyDoubleCborEncoding(arbitrator_arbitrator_spend),
    [profilePolicyId, projectPolicyId]
  );
  const arbitratorSpendingValidator: SpendingValidator = {
    type: "PlutusV3",
    script: arbitratorSpendingScript,
  };
  const arbitratorScriptAddress = validatorToAddress(
    network,
    arbitratorSpendingValidator
  );

  // 5. Generate Dispute NFT
  const now = await blockfrost.getLatestTime();
  const disputeTokenName = fromText(
    "DISPUTE" + now.toString().slice(-8) + Math.floor(Math.random() * 1000)
  );
  const disputeNftUnit = arbitratorPolicyId + disputeTokenName;

  // 6. Construct Datums
  const disputeDatum: DisputeDatum = {
    ai_agent_id: null,
    ai_decision: null,
    completion_percentage: null,
    ai_confidence: null,
    ai_analysis_hash: null,
    re_dispute_deadline: null,
    state: "Pending",
    re_dispute_requested: false,
    re_dispute_reason_hash: null,
    arbitrator_nft: null,
    final_decision: null,
    final_completion_percentage: null,
    resolved_at: null,
  };

  const updatedProjectDatum: ProjectDatum = {
    ...currentProjectDatum,
    status: "Disputed",
    dispute_nft: {
      policy_id: arbitratorPolicyId,
      asset_name: disputeTokenName,
    },
  };

  const updatedClientDatum: UserProfileDatum = {
    ...clientProfileDatum,
    total_disputed: clientProfileDatum.total_disputed + 1n,
  };

  const updatedFreelancerDatum: UserProfileDatum = {
    ...freelancerProfileDatum,
    total_disputed: freelancerProfileDatum.total_disputed + 1n,
  };

  // 7. Fetch Reference Scripts
  const projectSpendRefUtxo = await getReferenceScriptUtxo(lucid, "project");
  const profileSpendRefUtxo = await getReferenceScriptUtxo(
    lucid,
    "user_profile"
  );

  // 8. Build Transaction
  const tx = await lucid
    .newTx()
    // Mint Dispute NFT
    .mintAssets(
      { [disputeNftUnit]: 1n },
      Data.to("DisputeProject", ArbitratorMintRedeemer)
    )
    .attach.MintingPolicy(arbitratorMintingPolicy)
    // Pay Dispute UTxO to Arbitrator Script
    .pay.ToContract(
      arbitratorScriptAddress,
      { kind: "inline", value: Data.to(disputeDatum, DisputeDatum) },
      { [disputeNftUnit]: 1n, lovelace: 5_000_000n } // Min ADA + Dispute NFT
    )
    // Spend Project UTxO
    .collectFrom([projectUtxo], Data.to("ProjectDispute", ProjectRedeemer))
    .pay.ToContract(
      projectScriptAddress,
      { kind: "inline", value: Data.to(updatedProjectDatum, ProjectDatum) },
      projectUtxo.assets // Keep same assets
    )
    // Spend Client Profile
    .collectFrom(
      [clientProfileUtxo],
      Data.to("ProjectDispute", UserProfileRedeemer)
    )
    .pay.ToContract(
      profileScriptAddress,
      { kind: "inline", value: Data.to(updatedClientDatum, UserProfileDatum) },
      clientProfileUtxo.assets
    )
    // Spend Freelancer Profile
    .collectFrom(
      [freelancerProfileUtxo],
      Data.to("ProjectDispute", UserProfileRedeemer)
    )
    .pay.ToContract(
      profileScriptAddress,
      {
        kind: "inline",
        value: Data.to(updatedFreelancerDatum, UserProfileDatum),
      },
      freelancerProfileUtxo.assets
    )
    .readFrom([projectSpendRefUtxo, profileSpendRefUtxo])
    .addSignerKey(pkh)
    .complete();

  const signedTx = await tx.sign.withWallet().complete();
  const txHash = await signedTx.submit();

  return txHash;
};

export const resolveDisputeAI = async (
    lucid: LucidEvolution,
    disputeNftAssetName: string,
    resolution: {
        decision: "Client" | "Freelancer" | "Split"; // Simplified for now, mapped to bytes
        completionPercentage: number;
        confidence: number;
        analysisHash: string;
    }
): Promise<string> => {
    const address = await lucid.wallet().address();
    const pkh = paymentCredentialOf(address)?.hash;

    if (!pkh) throw new Error("Invalid address");

    const network = lucid.config().network;
    if (!network) throw new Error("Network not configured");

    // 1. Get Arbitrator Script Address
    const profileMintingPolicy: MintingPolicy = {
        type: "PlutusV3",
        script: applyDoubleCborEncoding(userprofile_user_profile_mint),
    };
    const profilePolicyId = mintingPolicyToId(profileMintingPolicy);

    const projectMintingScript = applyParamsToScript(
        applyDoubleCborEncoding(project_project_contract_mint),
        [profilePolicyId]
    );
    const projectMintingPolicy: MintingPolicy = {
        type: "PlutusV3",
        script: projectMintingScript,
    };
    const projectPolicyId = mintingPolicyToId(projectMintingPolicy);

    const arbitratorSpendingScript = applyParamsToScript(
        applyDoubleCborEncoding(arbitrator_arbitrator_spend),
        [profilePolicyId, projectPolicyId]
    );
    const arbitratorSpendingValidator: SpendingValidator = {
        type: "PlutusV3",
        script: arbitratorSpendingScript,
    };
    const arbitratorScriptAddress = validatorToAddress(
        network,
        arbitratorSpendingValidator
    );

    const arbitratorMintingScript = applyParamsToScript(
        applyDoubleCborEncoding(arbitrator_arbitrator_mint),
        [profilePolicyId, projectPolicyId]
    );
    const arbitratorMintingPolicy: MintingPolicy = {
        type: "PlutusV3",
        script: arbitratorMintingScript,
    };
    const arbitratorPolicyId = mintingPolicyToId(arbitratorMintingPolicy);

    // 2. Find Dispute UTxO
    const disputeNftUnit = arbitratorPolicyId + disputeNftAssetName;
    const arbitratorUtxos = await lucid.utxosAt(arbitratorScriptAddress);
    const disputeUtxo = arbitratorUtxos.find((utxo) =>
        Object.keys(utxo.assets).includes(disputeNftUnit)
    );

    if (!disputeUtxo) throw new Error("Dispute UTxO not found");

    const currentDisputeDatum = Data.from(disputeUtxo.datum!, DisputeDatum);

    if (currentDisputeDatum.state !== "Pending") {
        throw new Error("Dispute is not in Pending state");
    }

    // 3. Construct Updated Datum
    const now = await blockfrost.getLatestTime();
    const oneWeek = 7 * 24 * 60 * 60 * 1000; // 7 days in ms
    const reDisputeDeadline = BigInt(now + oneWeek);

    const updatedDisputeDatum: DisputeDatum = {
        ...currentDisputeDatum,
        state: "AIResolved",
        ai_agent_id: pkh, // The signer is the AI agent
        ai_decision: fromText(resolution.decision),
        completion_percentage: BigInt(resolution.completionPercentage),
        ai_confidence: BigInt(resolution.confidence),
        ai_analysis_hash: fromText(resolution.analysisHash), // Assuming hash is passed as text/hex
        re_dispute_deadline: reDisputeDeadline,
    };

    // 4. Build Transaction
    const tx = await lucid
        .newTx()
        .collectFrom([disputeUtxo], Data.to("AIResolve", ArbitratorRedeemer))
        .pay.ToContract(
            arbitratorScriptAddress,
            { kind: "inline", value: Data.to(updatedDisputeDatum, DisputeDatum) },
            disputeUtxo.assets
        )
        .addSignerKey(pkh) // Sign as AI Agent
        .complete();

    const signedTx = await tx.sign.withWallet().complete();
    const txHash = await signedTx.submit();

    return txHash;
};

export const finalizeDispute = async (
    lucid: LucidEvolution,
    projectNftAssetName: string
): Promise<string> => {
    const address = await lucid.wallet().address();
    const pkh = paymentCredentialOf(address)?.hash;

    if (!pkh) throw new Error("Invalid address");

    const network = lucid.config().network;
    if (!network) throw new Error("Network not configured");

    // 1. Get Script Addresses
    const profileMintingPolicy: MintingPolicy = {
        type: "PlutusV3",
        script: applyDoubleCborEncoding(userprofile_user_profile_mint),
    };
    const profilePolicyId = mintingPolicyToId(profileMintingPolicy);

    const projectMintingScript = applyParamsToScript(
        applyDoubleCborEncoding(project_project_contract_mint),
        [profilePolicyId]
    );
    const projectMintingPolicy: MintingPolicy = {
        type: "PlutusV3",
        script: projectMintingScript,
    };
    const projectPolicyId = mintingPolicyToId(projectMintingPolicy);
    const projectScriptAddress = validatorToAddress(network, {
        type: "PlutusV3",
        script: applyParamsToScript(
            applyDoubleCborEncoding(project_project_contract_spend),
            [profilePolicyId]
        ),
    });

    const arbitratorSpendingScript = applyParamsToScript(
        applyDoubleCborEncoding(arbitrator_arbitrator_spend),
        [profilePolicyId, projectPolicyId]
    );
    const arbitratorSpendingValidator: SpendingValidator = {
        type: "PlutusV3",
        script: arbitratorSpendingScript,
    };
    const arbitratorScriptAddress = validatorToAddress(
        network,
        arbitratorSpendingValidator
    );

    const arbitratorMintingScript = applyParamsToScript(
        applyDoubleCborEncoding(arbitrator_arbitrator_mint),
        [profilePolicyId, projectPolicyId]
    );
    const arbitratorMintingPolicy: MintingPolicy = {
        type: "PlutusV3",
        script: arbitratorMintingScript,
    };
    const arbitratorPolicyId = mintingPolicyToId(arbitratorMintingPolicy);

    // 2. Find Project UTxO
    const projectNftUnit = projectPolicyId + projectNftAssetName;
    const projectUtxos = await lucid.utxosAt(projectScriptAddress);
    const projectUtxo = projectUtxos.find((utxo) =>
        Object.keys(utxo.assets).includes(projectNftUnit)
    );

    if (!projectUtxo) throw new Error("Project UTxO not found");

    const projectDatum = Data.from(projectUtxo.datum!, ProjectDatum);

    if (projectDatum.status !== "Disputed") {
        throw new Error("Project is not in Disputed state");
    }

    // 3. Find Dispute UTxO
    if (!projectDatum.dispute_nft) throw new Error("No Dispute NFT linked");
    const disputeNftUnit = projectDatum.dispute_nft.policy_id + projectDatum.dispute_nft.asset_name;

    const arbitratorUtxos = await lucid.utxosAt(arbitratorScriptAddress);
    const disputeUtxo = arbitratorUtxos.find((utxo) =>
        Object.keys(utxo.assets).includes(disputeNftUnit)
    );

    if (!disputeUtxo) throw new Error("Dispute UTxO not found");

    const disputeDatum = Data.from(disputeUtxo.datum!, DisputeDatum);

    if (disputeDatum.state !== "AIResolved") {
        throw new Error("Dispute is not AIResolved");
    }

    // Check deadline
    const now = await blockfrost.getLatestTime();
    if (!disputeDatum.re_dispute_deadline || BigInt(now) <= disputeDatum.re_dispute_deadline) {
        throw new Error("Re-dispute deadline has not passed");
    }

    // 4. Find Profile UTxOs
    const clientNftUnit = projectDatum.client_nft.policy_id + projectDatum.client_nft.asset_name;
    const freelancerNftUnit = projectDatum.freelancer_nft!.policy_id + projectDatum.freelancer_nft!.asset_name;

    const profileScriptAddress = validatorToAddress(network, {
        type: "PlutusV3",
        script: applyDoubleCborEncoding(userprofile_user_profile_spend),
    });

    const profileUtxos = await lucid.utxosAt(profileScriptAddress);
    const clientProfileUtxo = profileUtxos.find((utxo) =>
        Object.keys(utxo.assets).includes(clientNftUnit)
    );
    const freelancerProfileUtxo = profileUtxos.find((utxo) =>
        Object.keys(utxo.assets).includes(freelancerNftUnit)
    );

    if (!clientProfileUtxo || !freelancerProfileUtxo) throw new Error("Profile UTxOs not found");

    const clientDatum = Data.from(clientProfileUtxo.datum!, UserProfileDatum);
    const freelancerDatum = Data.from(freelancerProfileUtxo.datum!, UserProfileDatum);

    // 5. Prepare Updates
    // Project: Completed
    const updatedProjectDatum: ProjectDatum = {
        ...projectDatum,
        status: "Completed",
    };

    // Profiles: Decrement active projects and collateral
    const updatedClientDatum: UserProfileDatum = {
        ...clientDatum,
        active_projects_as_client: clientDatum.active_projects_as_client - 1n,
        project_collateral: clientDatum.project_collateral - 25_000_000n,
        // Add logic for reputation update based on decision if needed
    };

    const updatedFreelancerDatum: UserProfileDatum = {
        ...freelancerDatum,
        active_projects_as_freelancer: freelancerDatum.active_projects_as_freelancer - 1n,
        project_collateral: freelancerDatum.project_collateral - 25_000_000n,
    };

    // 6. Fund Distribution
    const decision = disputeDatum.ai_decision ? new TextDecoder().decode(fromHex(disputeDatum.ai_decision)) : "Split";

    let clientPayout = 0n;
    let freelancerPayout = 0n;

    const totalProjectValue = projectUtxo.assets["lovelace"];

    if (decision === "Client") {
        clientPayout = totalProjectValue;
    } else if (decision === "Freelancer") {
        freelancerPayout = totalProjectValue;
    } else {
        clientPayout = totalProjectValue / 2n;
        freelancerPayout = totalProjectValue / 2n;
    }

    // 7. Build Transaction
    const tx = lucid
        .newTx()
        .collectFrom([disputeUtxo], Data.to("Finalize", ArbitratorRedeemer))
        .collectFrom([projectUtxo], Data.to("ProjectFinalize", ProjectRedeemer))
        .collectFrom([clientProfileUtxo], Data.to("Finalize", UserProfileRedeemer))
        .collectFrom([freelancerProfileUtxo], Data.to("Finalize", UserProfileRedeemer))
        .mintAssets({ [disputeNftUnit]: -1n }, Data.to("NoRedispute", ArbitratorMintRedeemer))
        .attach.MintingPolicy(arbitratorMintingPolicy)
        .pay.ToContract(
            projectScriptAddress,
            { kind: "inline", value: Data.to(updatedProjectDatum, ProjectDatum) },
            { [projectNftUnit]: 1n }
        )
        .pay.ToContract(
            profileScriptAddress,
            { kind: "inline", value: Data.to(updatedClientDatum, UserProfileDatum) },
            clientProfileUtxo.assets
        )
        .pay.ToContract(
            profileScriptAddress,
            { kind: "inline", value: Data.to(updatedFreelancerDatum, UserProfileDatum) },
            freelancerProfileUtxo.assets
        );

    if (clientPayout > 0n) {
        tx.pay.ToAddress(clientDatum.user_address.address, { lovelace: clientPayout });
    }
    if (freelancerPayout > 0n) {
        tx.pay.ToAddress(freelancerDatum.user_address.address, { lovelace: freelancerPayout });
    }

    tx.validFrom(now);

    const signedTx = await tx.complete();
    const txHash = await signedTx.sign.withWallet().submit();

    return txHash;
};
