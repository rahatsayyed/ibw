"use client";

import { useState } from "react";
import { useWallet } from "@/context/walletContext";
import { Button } from "@heroui/button";
import { Card, CardBody, CardHeader } from "@heroui/card";
import {
  userprofile_user_profile_mint,
  userprofile_user_profile_spend,
  project_project_contract_mint,
  project_project_contract_spend,
  arbitrator_arbitrator_spend,
} from "@/config/scripts/plutus";
import {
  applyDoubleCborEncoding,
  applyParamsToScript,
  Data,
  mintingPolicyToId,
  validatorToScriptHash,
} from "@lucid-evolution/lucid";
import { supabase } from "@/lib/supabase";

type ScriptConfig = {
  name: string;
  script: string;
  type: "MintingPolicy" | "SpendingValidator";
  params?: "none" | "single" | "double";
};

const SCRIPTS: ScriptConfig[] = [
  {
    name: "user_profile",
    script: userprofile_user_profile_spend,
    type: "SpendingValidator",
    params: "none",
  },
  {
    name: "project",
    script: project_project_contract_spend,
    type: "SpendingValidator",
    params: "single", // Takes profile_nft PolicyId
  },
  {
    name: "arbitrator",
    script: arbitrator_arbitrator_spend,
    type: "SpendingValidator",
    params: "double", // Takes profile_nft and project_nft PolicyIds
  },
];

export default function AdminScriptsPage() {
  const [walletConnection] = useWallet();
  const { lucid } = walletConnection;

  const [deploying, setDeploying] = useState<string | null>(null);
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = (msg: string) => setLogs((prev) => [...prev, msg]);

  /**
   * Deploy a non-parameterized script as a reference UTxO
   */
  const deployNonParameterizedScript = async (
    scriptName: string,
    scriptHex: string
  ) => {
    if (!lucid) {
      addLog("Wallet not connected");
      return;
    }

    try {
      setDeploying(scriptName);
      addLog(`Deploying ${scriptName}...`);

      const address = await lucid.wallet().address();

      const script = {
        type: "PlutusV3" as const,
        script: applyDoubleCborEncoding(scriptHex),
      };

      const tx = await lucid
        .newTx()
        .pay.ToAddressWithData(
          address,
          { kind: "inline", value: "00" },
          { lovelace: 0n },
          script
        )
        .complete();

      const signedTx = await tx.sign.withWallet().complete();
      const txHash = await signedTx.submit();

      addLog(`Transaction submitted: ${txHash}`);
      addLog("Waiting for confirmation...");

      await lucid.awaitTx(txHash);

      addLog("Transaction confirmed. Finding UTxO...");

      const utxos = await lucid.utxosAt(address);
      const scriptUtxo = utxos.find(
        (u: any) => u.txHash === txHash && u.scriptRef
      );

      if (!scriptUtxo) {
        throw new Error(
          "Could not find the reference script UTxO after confirmation."
        );
      }

      addLog(`Found UTxO: ${scriptUtxo.txHash}#${scriptUtxo.outputIndex}`);

      const { error } = await supabase.from("reference_scripts").upsert(
        {
          script_name: scriptName,
          tx_hash: scriptUtxo.txHash,
          output_index: scriptUtxo.outputIndex,
          script_hash: scriptUtxo.scriptRef?.script,
        },
        { onConflict: "script_name" }
      );

      if (error) throw error;

      addLog(`Saved ${scriptName} to database.`);
    } catch (e: any) {
      console.error(e);
      addLog(`Error: ${e.message}`);
    } finally {
      setDeploying(null);
    }
  };

  /**
   * Deploy a script with 1 parameter (profile_nft: PolicyId) as a reference UTxO
   * Note: This requires the Profile NFT PolicyId to be known
   */
  const deploySingleParamScript = async (
    scriptName: string,
    scriptHex: string
  ) => {
    if (!lucid) {
      addLog("Wallet not connected");
      return;
    }

    try {
      setDeploying(scriptName);
      addLog(`Deploying ${scriptName} (single param)...`);
      addLog(
        "⚠️ This requires profile_nft PolicyId - using userprofile_user_profile_mint policy"
      );

      const address = await lucid.wallet().address();

      // Derive the profile NFT policy ID from the mint script
      const mintScript = {
        type: "PlutusV3" as const,
        script: applyDoubleCborEncoding(userprofile_user_profile_mint),
      };

      const profileNftPolicyId = mintingPolicyToId(mintScript);
      addLog(`Using profile_nft PolicyId: ${profileNftPolicyId}`);

      // Apply parameter to script
      const parameterizedScript = applyParamsToScript(scriptHex, [
        profileNftPolicyId,
      ]);

      const script = {
        type: "PlutusV3" as const,
        script: applyDoubleCborEncoding(parameterizedScript),
      };

      const tx = await lucid
        .newTx()
        .pay.ToAddressWithData(
          address,
          { kind: "inline", value: "00" },
          { lovelace: 0n },
          script
        )
        .complete();

      const signedTx = await tx.sign.withWallet().complete();
      const txHash = await signedTx.submit();

      addLog(`Transaction submitted: ${txHash}`);
      addLog("Waiting for confirmation...");

      await lucid.awaitTx(txHash);

      addLog("Transaction confirmed. Finding UTxO...");

      const utxos = await lucid.utxosAt(address);
      const scriptUtxo = utxos.find(
        (u: any) => u.txHash === txHash && u.scriptRef
      );

      if (!scriptUtxo) {
        throw new Error(
          "Could not find the reference script UTxO after confirmation."
        );
      }

      addLog(`Found UTxO: ${scriptUtxo.txHash}#${scriptUtxo.outputIndex}`);

      const { error } = await supabase.from("reference_scripts").upsert(
        {
          script_name: scriptName,
          tx_hash: scriptUtxo.txHash,
          output_index: scriptUtxo.outputIndex,
          script_hash: scriptUtxo.scriptRef?.script,
        },
        { onConflict: "script_name" }
      );

      if (error) throw error;

      addLog(`Saved ${scriptName} to database.`);
    } catch (e: any) {
      console.error(e);
      addLog(`Error: ${e.message}`);
    } finally {
      setDeploying(null);
    }
  };

  /**
   * Deploy a script with 2 parameters (profile_nft: PolicyId, project_nft: PolicyId) as a reference UTxO
   * Note: This requires both Profile NFT and Project NFT PolicyIds
   */
  const deployDoubleParamScript = async (
    scriptName: string,
    scriptHex: string
  ) => {
    if (!lucid) {
      addLog("Wallet not connected");
      return;
    }

    try {
      setDeploying(scriptName);
      addLog(`Deploying ${scriptName} (double param)...`);
      addLog("⚠️ This requires profile_nft and project_nft PolicyIds");

      const address = await lucid.wallet().address();

      // Derive policy IDs
      const profileMintScript = {
        type: "PlutusV3" as const,
        script: applyDoubleCborEncoding(userprofile_user_profile_mint),
      };
      const profileNftPolicyId = mintingPolicyToId(profileMintScript);
      addLog(`Using profile_nft PolicyId: ${profileNftPolicyId}`);

      // For project NFT, we need the parameterized version
      // First apply profile_nft to get the project minting policy
      const projectMintWithParam = applyParamsToScript(
        project_project_contract_mint,
        [profileNftPolicyId]
      );
      const projectMintScript = {
        type: "PlutusV3" as const,
        script: applyDoubleCborEncoding(projectMintWithParam),
      };
      const projectNftPolicyId = mintingPolicyToId(projectMintScript);
      addLog(`Using project_nft PolicyId: ${projectNftPolicyId}`);

      // Apply both parameters to the arbitrator script
      const parameterizedScript = applyParamsToScript(scriptHex, [
        profileNftPolicyId,
        projectNftPolicyId,
      ]);

      const script = {
        type: "PlutusV3" as const,
        script: applyDoubleCborEncoding(parameterizedScript),
      };

      const tx = await lucid
        .newTx()
        .pay.ToAddressWithData(
          address,
          { kind: "inline", value: "00" },
          { lovelace: 0n },
          script
        )
        .complete();

      const signedTx = await tx.sign.withWallet().complete();
      const txHash = await signedTx.submit();

      addLog(`Transaction submitted: ${txHash}`);
      addLog("Waiting for confirmation...");

      await lucid.awaitTx(txHash);

      addLog("Transaction confirmed. Finding UTxO...");

      const utxos = await lucid.utxosAt(address);
      const scriptUtxo = utxos.find(
        (u: any) => u.txHash === txHash && u.scriptRef
      );

      if (!scriptUtxo) {
        throw new Error(
          "Could not find the reference script UTxO after confirmation."
        );
      }

      addLog(`Found UTxO: ${scriptUtxo.txHash}#${scriptUtxo.outputIndex}`);

      const { error } = await supabase.from("reference_scripts").upsert(
        {
          script_name: scriptName,
          tx_hash: scriptUtxo.txHash,
          output_index: scriptUtxo.outputIndex,
          script_hash: scriptUtxo.scriptRef?.script,
        },
        { onConflict: "script_name" }
      );

      if (error) throw error;

      addLog(`Saved ${scriptName} to database.`);
    } catch (e: any) {
      console.error(e);
      addLog(`Error: ${e.message}`);
    } finally {
      setDeploying(null);
    }
  };

  const deployScript = async (config: ScriptConfig) => {
    switch (config.params) {
      case "none":
        return deployNonParameterizedScript(config.name, config.script);
      case "single":
        return deploySingleParamScript(config.name, config.script);
      case "double":
        return deployDoubleParamScript(config.name, config.script);
      default:
        addLog(`Unknown parameter type for ${config.name}`);
    }
  };

  /**
   * Deploy all scripts using transaction chaining
   * This allows sequential deployments without waiting for on-chain confirmation between each
   */
  const deployAllScriptsChained = async () => {
    if (!lucid) {
      addLog("Wallet not connected");
      return;
    }

    try {
      setDeploying("all_chained");
      addLog("🔗 Starting chained deployment of all reference scripts...");

      const address = await lucid.wallet().address();

      // Prepare policy IDs for parameterized scripts
      const profileMintScript = {
        type: "PlutusV3" as const,
        script: applyDoubleCborEncoding(userprofile_user_profile_mint),
      };
      const profileNftPolicyId = mintingPolicyToId(profileMintScript);

      const projectMintWithParam = applyParamsToScript(
        project_project_contract_mint,
        [profileNftPolicyId]
      );
      const projectMintScript = {
        type: "PlutusV3" as const,
        script: applyDoubleCborEncoding(projectMintWithParam),
      };
      const projectNftPolicyId = mintingPolicyToId(projectMintScript);

      addLog(`📋 Profile NFT Policy: ${profileNftPolicyId}`);
      addLog(`📋 Project NFT Policy: ${projectNftPolicyId}`);

      // Prepare all scripts
      const scripts = [
        {
          name: "user_profile",
          script: {
            type: "PlutusV3" as const,
            script: applyDoubleCborEncoding(userprofile_user_profile_spend),
          },
        },
        {
          name: "project",
          script: {
            type: "PlutusV3" as const,
            script: applyDoubleCborEncoding(
              applyParamsToScript(project_project_contract_spend, [
                profileNftPolicyId,
              ])
            ),
          },
        },
        {
          name: "arbitrator",
          script: {
            type: "PlutusV3" as const,
            script: applyDoubleCborEncoding(
              applyParamsToScript(arbitrator_arbitrator_spend, [
                profileNftPolicyId,
                projectNftPolicyId,
              ])
            ),
          },
        },
      ];

      // Helper to find script output index
      const findScriptOutputIndex = (builder: any): number => {
        try {
          // Try to access txComplete (Lucid Evolution pattern)
          const txComplete = builder.txComplete;
          if (!txComplete) return 0; // Fallback

          const outputs = txComplete.body().outputs();
          for (let i = 0; i < outputs.len(); i++) {
            const output = outputs.get(i);
            if (output.script_ref()) {
              return i;
            }
          }
        } catch (e) {
          console.warn("Could not determine output index, defaulting to 0", e);
        }
        return 0;
      };

      // Transaction 1: Deploy user_profile_spend
      addLog(`\n1️⃣ Deploying ${scripts[0].name}...`);
      const [newWalletUTxOs1, derivedOutputs1, txSignBuilder1] = await lucid
        .newTx()
        .pay.ToAddressWithData(
          address,
          { kind: "inline", value: "00" },
          { lovelace: 0n },
          scripts[0].script
        )
        .chain();

      const signedTx1 = await txSignBuilder1.sign.withWallet().complete();
      const txHash1 = await signedTx1.submit();
      addLog(`  ✅ TX submitted: ${txHash1.slice(0, 20)}...`);

      // Store Tx1 immediately
      const outputIndex1 = findScriptOutputIndex(txSignBuilder1);
      const scriptHash1 = validatorToScriptHash(scripts[0].script);
      await supabase.from("reference_scripts").upsert(
        {
          script_name: scripts[0].name,
          tx_hash: txHash1,
          output_index: outputIndex1,
          script_hash: scriptHash1,
        },
        { onConflict: "script_name" }
      );
      addLog(`  💾 Saved ${scripts[0].name} (idx: ${outputIndex1})`);

      // Update wallet UTxOs
      lucid.overrideUTxOs(newWalletUTxOs1);

      // Transaction 2: Deploy project_spend
      addLog(`\n2️⃣ Deploying ${scripts[1].name}...`);
      const [newWalletUTxOs2, derivedOutputs2, txSignBuilder2] = await lucid
        .newTx()
        .pay.ToAddressWithData(
          address,
          { kind: "inline", value: "00" },
          { lovelace: 0n },
          scripts[1].script
        )
        .chain();

      const signedTx2 = await txSignBuilder2.sign.withWallet().complete();
      const txHash2 = await signedTx2.submit();
      addLog(`  ✅ TX submitted: ${txHash2.slice(0, 20)}...`);

      // Store Tx2 immediately
      const outputIndex2 = findScriptOutputIndex(txSignBuilder2);
      const scriptHash2 = validatorToScriptHash(scripts[1].script);
      await supabase.from("reference_scripts").upsert(
        {
          script_name: scripts[1].name,
          tx_hash: txHash2,
          output_index: outputIndex2,
          script_hash: scriptHash2,
        },
        { onConflict: "script_name" }
      );
      addLog(`  💾 Saved ${scripts[1].name} (idx: ${outputIndex2})`);

      lucid.overrideUTxOs(newWalletUTxOs2);

      // Transaction 3: Deploy arbitrator_spend
      addLog(`\n3️⃣ Deploying ${scripts[2].name}...`);
      const [newWalletUTxOs3, derivedOutputs3, txSignBuilder3] = await lucid
        .newTx()
        .pay.ToAddressWithData(
          address,
          { kind: "inline", value: "00" },
          { lovelace: 0n },
          scripts[2].script
        )
        .chain();

      const signedTx3 = await txSignBuilder3.sign.withWallet().complete();
      const txHash3 = await signedTx3.submit();
      addLog(`  ✅ TX submitted: ${txHash3.slice(0, 20)}...`);

      // Store Tx3 immediately
      const outputIndex3 = findScriptOutputIndex(txSignBuilder3);
      const scriptHash3 = validatorToScriptHash(scripts[2].script);
      await supabase.from("reference_scripts").upsert(
        {
          script_name: scripts[2].name,
          tx_hash: txHash3,
          output_index: outputIndex3,
          script_hash: scriptHash3,
        },
        { onConflict: "script_name" }
      );
      addLog(`  💾 Saved ${scripts[2].name} (idx: ${outputIndex3})`);

      lucid.overrideUTxOs(newWalletUTxOs3);

      addLog("\n🎉 All reference scripts submitted and saved!");
      addLog("⏳ Transactions are processing on-chain...");

    } catch (e: any) {
      console.error(e);
      addLog(`\n❌ Error: ${e.message}`);
    } finally {
      setDeploying(null);
    }
  };

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-2xl font-bold mb-6">Deploy Reference Scripts</h1>

      {/* Deploy All Button */}
      <Card className="mb-6 bg-gradient-to-r from-purple-500/10 to-blue-500/10">
        <CardBody className="flex flex-row items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">
              Deploy All Spend Validators
            </h2>
            <p className="text-sm text-gray-500">
              Deploys 3 reference scripts (userprofile, project, arbitrator)
              using transaction chaining
            </p>
          </div>
          <Button
            color="primary"
            size="lg"
            isLoading={deploying === "all_chained"}
            isDisabled={!!deploying || !lucid}
            onPress={deployAllScriptsChained}
          >
            🔗 Deploy All (Chained)
          </Button>
        </CardBody>
      </Card>

      <div className="grid gap-4">
        {SCRIPTS.map((item) => (
          <Card key={item.name}>
            <CardHeader className="flex justify-between items-center">
              <div>
                <span className="font-mono">{item.name}</span>
                <span className="text-sm text-gray-500 ml-2">
                  (
                  {item.params === "none"
                    ? "no params"
                    : item.params === "single"
                      ? "1 param"
                      : "2 params"}
                  )
                </span>
              </div>
              <Button
                isLoading={deploying === item.name}
                isDisabled={!!deploying || !lucid}
                onPress={() => deployScript(item)}
              >
                Deploy
              </Button>
            </CardHeader>
          </Card>
        ))}
      </div>

      <Card className="mt-8">
        <CardHeader>Logs</CardHeader>
        <CardBody className="bg-black/90 text-green-400 font-mono text-sm h-64 overflow-y-auto">
          {logs.map((log, i) => (
            <div key={i}>{log}</div>
          ))}
        </CardBody>
      </Card>
    </div>
  );
}
