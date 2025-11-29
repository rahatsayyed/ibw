"use client";

import { useState } from "react";
import { Input, Textarea } from "@heroui/input";
import { Button } from "@heroui/button";
import { Select, SelectItem } from "@heroui/select";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Divider } from "@heroui/divider";
import { Slider } from "@heroui/slider";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

export default function CreateProjectPage() {
    const { user } = useAuth();
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        title: "",
        description: "",
        criteria: "",
        repo_url: "",
        payment_amount: "",
        collateral_rate: "10",
        min_completion_percentage: 80,
        deadline: "",
    });

    const handleChange = (field: string, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const calculateTotalCost = () => {
        const payment = Number(formData.payment_amount) || 0;
        const fee = payment * 0.02;
        const reserve = 25;
        return { payment, fee, reserve, total: payment + fee + reserve };
    };

    const handleSubmit = async () => {
        if (!user) {
            toast.error("You must be logged in to create a project");
            return;
        }

        if (!formData.title || !formData.description || !formData.payment_amount || !formData.deadline) {
            toast.error("Please fill in all required fields");
            return;
        }

        setLoading(true);
        try {
            // Check balance (mock check for now, real check would query DB)
            const { data: profile } = await supabase
                .from("users")
                .select("available_balance, locked_balance")
                .eq("id", user.id)
                .single();

            const { total, payment, fee, reserve } = calculateTotalCost();
            // Convert total to Lovelace for comparison
            const totalLovelace = total * 1000000;

            if (!profile || (profile.available_balance || 0) < totalLovelace) {
                throw new Error(`Insufficient balance. You need ${total} ADA.`);
            }

            // ---------------------------------------------------------
            // MOCK CARDANO TRANSACTION (Escrow Lock)
            // ---------------------------------------------------------
            // const tx = await lucid.newTx()
            //   .payToContract(escrowScript, { inline: datum }, { lovelace: BigInt(totalLovelace) })
            //   .complete();
            // const signedTx = await tx.sign().complete();
            // const txHash = await signedTx.submit();
            // await lucid.awaitTx(txHash);
            // ---------------------------------------------------------

            // Deduct balance
            await supabase.from("users").update({
                available_balance: (profile.available_balance || 0) - totalLovelace,
                locked_balance: (profile.locked_balance || 0) + (reserve * 1000000) // Reserve
            }).eq("id", user.id);

            // Create Project
            const { error } = await supabase.from("projects").insert({
                client_id: user.id,
                title: formData.title,
                description: formData.description,
                success_criteria: formData.criteria,
                github_repo_url: formData.repo_url,
                payment_amount: Number(formData.payment_amount) * 1000000,
                collateral_rate: Number(formData.collateral_rate),
                platform_fee: fee * 1000000,
                minimum_completion_percentage: formData.min_completion_percentage,
                deadline: new Date(formData.deadline).toISOString(),
                status: "open"
            });

            if (error) throw error;

            toast.success("Project created successfully!");
            router.push("/marketplace");
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setLoading(false);
        }
    };

    const { payment, fee, reserve, total } = calculateTotalCost();

    return (
        <div className="max-w-4xl mx-auto pb-10">
            <div className="mb-8">
                <h1 className="text-3xl font-bold mb-2">Post a New Project</h1>
                <p className="text-default-500">
                    Create a trustless escrow agreement on the Cardano blockchain.
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Form Section */}
                <div className="lg:col-span-2 space-y-6">
                    <Card className="glass-card p-4">
                        <CardHeader>
                            <h2 className="text-xl font-bold">Project Details</h2>
                        </CardHeader>
                        <Divider className="my-2" />
                        <CardBody className="gap-6">
                            <Input
                                label="Project Title"
                                placeholder="e.g. Build a DeFi Dashboard"
                                variant="bordered"
                                isRequired
                                value={formData.title}
                                onValueChange={(v) => handleChange("title", v)}
                            />
                            <Textarea
                                label="Description"
                                placeholder="Describe the project requirements in detail..."
                                variant="bordered"
                                minRows={5}
                                isRequired
                                value={formData.description}
                                onValueChange={(v) => handleChange("description", v)}
                            />
                            <Textarea
                                label="Success Criteria"
                                placeholder="What defines a completed project? Be specific."
                                variant="bordered"
                                minRows={3}
                                isRequired
                                value={formData.criteria}
                                onValueChange={(v) => handleChange("criteria", v)}
                            />
                            <Input
                                label="GitHub Repository URL"
                                placeholder="https://github.com/username/repo"
                                variant="bordered"
                                startContent={<span className="text-default-400 text-small">github.com/</span>}
                                isRequired
                                value={formData.repo_url}
                                onValueChange={(v) => handleChange("repo_url", v)}
                            />
                        </CardBody>
                    </Card>

                    <Card className="glass-card p-4">
                        <CardHeader>
                            <h2 className="text-xl font-bold">Payment & Terms</h2>
                        </CardHeader>
                        <Divider className="my-2" />
                        <CardBody className="gap-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <Input
                                    label="Payment Amount (ADA)"
                                    placeholder="1000"
                                    type="number"
                                    variant="bordered"
                                    endContent={<span className="text-default-400 text-small">₳</span>}
                                    isRequired
                                    value={formData.payment_amount}
                                    onValueChange={(v) => handleChange("payment_amount", v)}
                                />
                                <Select
                                    label="Collateral Rate"
                                    placeholder="Select rate"
                                    variant="bordered"
                                    isRequired
                                    selectedKeys={[formData.collateral_rate]}
                                    onChange={(e) => handleChange("collateral_rate", e.target.value)}
                                >
                                    <SelectItem key="5">5%</SelectItem>
                                    <SelectItem key="10">10%</SelectItem>
                                    <SelectItem key="20">20%</SelectItem>
                                </Select>
                            </div>

                            <div className="py-2">
                                <Slider
                                    label="Minimum Completion Threshold"
                                    step={5}
                                    minValue={50}
                                    maxValue={100}
                                    defaultValue={80}
                                    className="max-w-md"
                                    marks={[
                                        { value: 50, label: "50%" },
                                        { value: 80, label: "80%" },
                                        { value: 100, label: "100%" },
                                    ]}
                                    value={formData.min_completion_percentage}
                                    onChange={(v) => handleChange("min_completion_percentage", v)}
                                />
                                <p className="text-tiny text-default-400 mt-2">
                                    If a dispute occurs, the AI will determine if at least this % of work was completed.
                                </p>
                            </div>

                            <Input
                                label="Deadline"
                                type="date"
                                variant="bordered"
                                isRequired
                                value={formData.deadline}
                                onValueChange={(v) => handleChange("deadline", v)}
                            />
                        </CardBody>
                    </Card>
                </div>

                {/* Summary Section */}
                <div className="lg:col-span-1">
                    <Card className="glass-card sticky top-24">
                        <CardHeader>
                            <h3 className="text-lg font-bold">Summary</h3>
                        </CardHeader>
                        <Divider />
                        <CardBody className="gap-4">
                            <div className="flex justify-between">
                                <span className="text-default-500">Payment</span>
                                <span className="font-semibold">{payment} ₳</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-default-500">Platform Fee (2%)</span>
                                <span className="font-semibold">{fee} ₳</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-default-500">Reserve Deposit</span>
                                <span className="font-semibold">{reserve} ₳</span>
                            </div>
                            <Divider />
                            <div className="flex justify-between text-lg font-bold text-primary">
                                <span>Total Cost</span>
                                <span>{total} ₳</span>
                            </div>

                            <Button
                                color="primary"
                                className="w-full font-bold shadow-lg shadow-primary/40 mt-4"
                                isLoading={loading}
                                onPress={handleSubmit}
                            >
                                Create Project
                            </Button>
                            <p className="text-tiny text-center text-default-400">
                                This will lock funds in a smart contract.
                            </p>
                        </CardBody>
                    </Card>
                </div>
            </div>
        </div>
    );
}
