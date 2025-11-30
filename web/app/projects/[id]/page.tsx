"use client";

import { useEffect, useState } from "react";
import { Button } from "@heroui/button";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Chip } from "@heroui/chip";
import { Divider } from "@heroui/divider";
import { User } from "@heroui/user";
import { GithubIcon } from "@/components/icons";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { DepositModal } from "@/components/deposit-modal";
import { useWallet } from "@/context/walletContext";
import {
  acceptProject,
  raiseDispute,
  resolveDisputeAI,
  finalizeDispute,
  reDispute,
} from "@/lib/contracts/project";

export default function ProjectDetailsPage() {
  const params = useParams();
  const id = params.id;
  const router = useRouter();
  const { user, userProfile, isAuthenticated } = useAuth();
  const [walletConnection] = useWallet();
  const { lucid } = walletConnection;

  const [project, setProject] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const [disputing, setDisputing] = useState(false);
  const [resolving, setResolving] = useState(false);
  const [finalizing, setFinalizing] = useState(false);
  const [reDisputing, setReDisputing] = useState(false);

  const [showDepositModal, setShowDepositModal] = useState(false);
  const [missingAmount, setMissingAmount] = useState(0);

  useEffect(() => {
    fetchProject();
  }, [id]);

  const fetchProject = async () => {
    try {
      const { data, error } = await supabase
        .from("projects")
        .select("*, client:users!client_id(*)")
        .eq("id", id)
        .single();

      if (error) throw error;
      setProject(data);
    } catch (error) {
      console.error("Error fetching project:", error);
      toast.error("Failed to load project details");
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptProject = async () => {
    if (!isAuthenticated) {
      toast.error("Please login to accept projects");
      return;
    }

    // Get user ID from either supabase user or userProfile
    const userId = user?.id || userProfile?.id;
    if (!userId) {
      toast.error("User ID not found");
      return;
    }

    if (project.client_id === userId) {
      toast.error("You cannot accept your own project");
      return;
    }

    setAccepting(true);
    try {
      // Calculate collateral amount (in Lovelace)
      const collateralAmount =
        (Number(project.payment_amount) * project.collateral_rate) / 100;

      // Check freelancer balance
      const { data: profile } = await supabase
        .from("users")
        .select("available_balance, locked_balance")
        .eq("id", userId)
        .single();

      if ((profile?.available_balance || 0) < collateralAmount) {
        const currentBalanceADA = (profile?.available_balance || 0) / 1000000;
        const requiredADA = collateralAmount / 1000000;
        const missing = requiredADA - currentBalanceADA;
        setMissingAmount(Number(Math.ceil(missing)));
        setShowDepositModal(true);
        setAccepting(false);
        return;
      }

      if (!lucid) {
        toast.error("Wallet not connected");
        setAccepting(false);
        return;
      }

      toast.info("Building accept transaction...");
      const txHash = await acceptProject(
        lucid,
        project.project_nft_asset_name,
        BigInt(collateralAmount)
      );

      toast.success(`Transaction submitted: ${txHash.slice(0, 10)}...`);
      // toast.info("Waiting for confirmation...");
      // await lucid.awaitTx(txHash);

      // Lock collateral
      await supabase
        .from("users")
        .update({
          available_balance:
            (profile?.available_balance || 0) - collateralAmount,
          locked_balance: (profile?.locked_balance || 0) + collateralAmount,
        })
        .eq("id", userId);

      // Update project
      const { error } = await supabase
        .from("projects")
        .update({
          status: "accepted",
          freelancer_id: userId,
          accepted_at: new Date().toISOString(),
        })
        .eq("id", id);

      if (error) throw error;

      toast.success("Project accepted successfully!");
      fetchProject();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setAccepting(false);
    }
  };

  const handleRaiseDispute = async () => {
    if (!isAuthenticated) return;
    if (!lucid) return;

    setDisputing(true);
    try {
      toast.info("Raising dispute...");
      const txHash = await raiseDispute(lucid, project.project_nft_asset_name);
      toast.success(`Dispute raised: ${txHash.slice(0, 10)}...`);

      // Update project status in DB
      const { error } = await supabase
        .from("projects")
        .update({
          status: "disputed",
          disputed_at: new Date().toISOString(),
        })
        .eq("id", id);

      if (error) throw error;

      toast.success("Project status updated to disputed");
      fetchProject();
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "Failed to raise dispute");
    } finally {
      setDisputing(false);
    }
  };

  const handleAIResolve = async () => {
    if (!isAuthenticated) {
      toast.error("Please login to resolve disputes");
      return;
    }
    if (!lucid) {
      toast.error("Wallet not connected");
      return;
    }
    setResolving(true);
    try {
      // Hardcoded resolution for simulation
      const resolution = {
        decision: "Client" as const,
        completionPercentage: 0,
        confidence: 95,
        analysisHash: "simulated_analysis_hash",
      };

      toast.info("Resolving dispute with AI...");
      const txHash = await resolveDisputeAI(
        lucid,
        project.project_nft_asset_name,
        resolution
      );
      toast.success(`Dispute resolved by AI (Simulated): ${txHash.slice(0, 10)}...`);

      // Update DB - In a real app, this might be listened to from chain,
      // but for now we update to reflect the change.
      // Note: The project status technically remains 'disputed' on-chain until finalized,
      // but the dispute state changes to AIResolved.
      // We might want to add a 'ai_resolved' status to DB or just keep it as disputed.
      // For visual feedback, let's just toast.
      fetchProject(); // Re-fetch to update UI if needed
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "Failed to resolve dispute");
    } finally {
      setResolving(false);
    }
  };

  const handleFinalize = async () => {
    if (!isAuthenticated) {
      toast.error("Please login to finalize dispute");
      return;
    }
    if (!lucid) {
      toast.error("Wallet not connected");
      return;
    }
    setFinalizing(true);
    try {
      toast.info("Finalizing dispute...");
      const txHash = await finalizeDispute(lucid, project.project_nft_asset_name);
      toast.success(`Dispute finalized: ${txHash.slice(0, 10)}...`);

      // Update DB
      await supabase
        .from("projects")
        .update({ status: "completed" })
        .eq("id", project.id);

      fetchProject();
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "Failed to finalize dispute");
    } finally {
      setFinalizing(false);
    }
  };

  const handleReDispute = async () => {
    if (!isAuthenticated) {
      toast.error("Please login to re-dispute");
      return;
    }
    if (!lucid) {
      toast.error("Wallet not connected");
      return;
    }
    setReDisputing(true);
    try {
      const reason = prompt("Enter reason for re-dispute:");
      if (!reason) {
        setReDisputing(false);
        return;
      }

      toast.info("Submitting re-dispute...");
      const txHash = await reDispute(lucid, project.project_nft_asset_name, reason);
      toast.success(`Re-dispute submitted: ${txHash.slice(0, 10)}...`);

      // Update DB - technically status is still 'disputed' but maybe we want to track 'human_review'
      // For now, just refresh
      fetchProject();
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "Failed to re-dispute");
    } finally {
      setReDisputing(false);
    }
  };

  if (loading)
    return <div className="p-10 text-center">Loading project details...</div>;
  if (!project)
    return <div className="p-10 text-center">Project not found</div>;

  const collateralAmountADA =
    (Number(project.payment_amount) * project.collateral_rate) / 100 / 1000000;
  const paymentADA = Number(project.payment_amount) / 1000000;

  return (
    <div className="max-w-5xl mx-auto pb-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold">{project.title}</h1>
            <Chip
              color={project.status === "open" ? "success" : "primary"}
              variant="flat"
            >
              {project.status}
            </Chip>
          </div>
          <div className="flex items-center gap-2 text-default-500">
            <span>Posted by</span>
            <User
              name={project.client?.username}
              description={`@${project.client?.username}`}
              avatarProps={{
                src: project.client?.profile_image_url,
              }}
              className="scale-90 origin-left"
            />
          </div>
        </div>
        <div className="flex gap-3">
          <Button
            variant="bordered"
            startContent={<GithubIcon />}
            as="a"
            href={project.github_repo_url}
            target="_blank"
          >
            View Repo
          </Button>
          {project.status === "open" && (
            <Button
              color="primary"
              className="font-bold shadow-lg shadow-primary/40"
              isLoading={accepting}
              onPress={handleAcceptProject}
            >
              Accept Project
            </Button>
          )}
          {project.status === "submitted" &&
            (user?.id === project.client_id ||
              user?.id === project.freelancer_id) && (
              <Button
                color="danger"
                variant="flat"
                className="font-bold"
                isLoading={disputing}
                onPress={handleRaiseDispute}
              >
                Raise Dispute
              </Button>
            )}

          {project.status === "disputed" && (
            <Button
              color="secondary"
              variant="flat"
              className="font-bold"
              isLoading={resolving}
              onPress={handleAIResolve}
            >
              Simulate AI Resolve
            </Button>
          )}

          {project.status === "disputed" && (
            <Button
              color="success"
              variant="flat"
              className="font-bold"
              isLoading={finalizing}
              onPress={handleFinalize}
            >
              Finalize Dispute
            </Button>
          )}

          {project.status === "disputed" && (
            <Button
              color="warning"
              variant="flat"
              className="font-bold"
              isLoading={reDisputing}
              onPress={handleReDispute}
            >
              Re-Dispute (Human Review)
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="glass-card p-4">
            <CardHeader>
              <h2 className="text-xl font-bold">Description</h2>
            </CardHeader>
            <Divider className="my-2" />
            <CardBody>
              <p className="text-default-500 whitespace-pre-line">
                {project.description}
              </p>
            </CardBody>
          </Card>

          <Card className="glass-card p-4">
            <CardHeader>
              <h2 className="text-xl font-bold">Success Criteria</h2>
            </CardHeader>
            <Divider className="my-2" />
            <CardBody>
              <p className="text-default-500 whitespace-pre-line">
                {project.success_criteria}
              </p>
            </CardBody>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="glass-card p-4">
            <CardHeader>
              <h3 className="text-lg font-bold">Project Terms</h3>
            </CardHeader>
            <Divider className="my-2" />
            <CardBody className="gap-4">
              <div className="flex justify-between items-center">
                <span className="text-default-500">Payment</span>
                <span className="text-2xl font-bold text-primary">
                  {paymentADA} ₳
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-default-500">Collateral Required</span>
                <span className="font-semibold text-warning">
                  {project.collateral_rate}% ({collateralAmountADA} ₳)
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-default-500">Deadline</span>
                <span>{new Date(project.deadline).toLocaleDateString()}</span>
              </div>
            </CardBody>
          </Card>

          {project.status === "open" && (
            <Card className="glass-card p-4 bg-primary/5 border-primary/20">
              <CardHeader>
                <h3 className="text-lg font-bold text-primary">
                  Freelancer Action
                </h3>
              </CardHeader>
              <Divider className="my-2" />
              <CardBody>
                <p className="text-small text-default-500 mb-4">
                  To accept this project, you must lock{" "}
                  <strong>{collateralAmountADA} ₳</strong> as collateral. This
                  ensures commitment to the deadline.
                </p>
                <Button
                  color="primary"
                  className="w-full font-bold"
                  isLoading={accepting}
                  onPress={handleAcceptProject}
                >
                  Lock Collateral & Accept
                </Button>
              </CardBody>
            </Card>
          )}
        </div>
      </div>
      <DepositModal
        isOpen={showDepositModal}
        onClose={() => setShowDepositModal(false)}
        missingAmount={missingAmount}
        onSuccess={handleAcceptProject}
      />
    </div >
  );
}
