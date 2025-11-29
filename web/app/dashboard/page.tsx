"use client";

import { useEffect, useState } from "react";
import { Card, CardBody } from "@heroui/card";
import { Tabs, Tab } from "@heroui/tabs";
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, useDisclosure } from "@heroui/modal";
import { ProjectCard } from "@/components/project-card";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";

export default function DashboardPage() {
    const { user } = useAuth();
    const [profile, setProfile] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [amount, setAmount] = useState("");
    const { isOpen, onOpen, onOpenChange } = useDisclosure();
    const [actionType, setActionType] = useState<"deposit" | "withdraw">("deposit");

    useEffect(() => {
        if (user) fetchProfile();
    }, [user]);

    const fetchProfile = async () => {
        try {
            const { data, error } = await supabase
                .from("users")
                .select("*")
                .eq("id", user?.id)
                .single();

            if (error) throw error;
            setProfile(data);
        } catch (error) {
            console.error("Error fetching profile:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleTransaction = async (onClose: () => void) => {
        if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
            toast.error("Please enter a valid amount");
            return;
        }

        const val = Number(amount);
        if (actionType === "withdraw" && val > (profile?.available_balance || 0)) {
            toast.error("Insufficient available balance");
            return;
        }

        try {
            const newBalance = actionType === "deposit"
                ? (Number(profile.total_balance) + val)
                : (Number(profile.total_balance) - val);

            const newAvailable = actionType === "deposit"
                ? (Number(profile.available_balance) + val)
                : (Number(profile.available_balance) - val);

            const { error } = await supabase
                .from("users")
                .update({
                    total_balance: newBalance,
                    available_balance: newAvailable
                })
                .eq("id", user?.id);

            if (error) throw error;

            toast.success(`${actionType === "deposit" ? "Deposit" : "Withdrawal"} successful!`);
            fetchProfile();
            onClose();
            setAmount("");
        } catch (error: any) {
            toast.error(error.message);
        }
    };

    const openModal = (type: "deposit" | "withdraw") => {
        setActionType(type);
        onOpen();
    };

    if (loading) return <div className="p-10 text-center">Loading dashboard...</div>;

    const stats = [
        { label: "Total Balance", value: `${profile?.total_balance || 0} ₳`, color: "text-primary" },
        { label: "Available", value: `${profile?.available_balance || 0} ₳`, color: "text-success" },
        { label: "Locked", value: `${profile?.locked_balance || 0} ₳`, color: "text-warning" },
        { label: "Reputation", value: profile?.reputation || 0, color: "text-secondary" },
    ];

    return (
        <div className="flex flex-col gap-8 pb-10">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold">Dashboard</h1>
                <div className="flex gap-2">
                    <Button color="primary" variant="flat" onPress={() => openModal("deposit")}>Deposit</Button>
                    <Button color="danger" variant="flat" onPress={() => openModal("withdraw")}>Withdraw</Button>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {stats.map((stat, index) => (
                    <Card key={index} className="glass-card">
                        <CardBody className="flex flex-col items-center justify-center py-6">
                            <span className="text-default-500 text-sm mb-1">{stat.label}</span>
                            <span className={`text-2xl font-bold ${stat.color}`}>{stat.value}</span>
                        </CardBody>
                    </Card>
                ))}
            </div>

            {/* Transaction Modal */}
            <Modal isOpen={isOpen} onOpenChange={onOpenChange}>
                <ModalContent>
                    {(onClose) => (
                        <>
                            <ModalHeader className="flex flex-col gap-1 capitalize">{actionType} ADA</ModalHeader>
                            <ModalBody>
                                <Input
                                    label="Amount"
                                    placeholder="0.00"
                                    type="number"
                                    variant="bordered"
                                    endContent={<span className="text-default-400 text-small">₳</span>}
                                    value={amount}
                                    onValueChange={setAmount}
                                />
                                {actionType === "withdraw" && (
                                    <p className="text-tiny text-default-500">
                                        Available: {profile?.available_balance} ₳
                                    </p>
                                )}
                            </ModalBody>
                            <ModalFooter>
                                <Button color="danger" variant="light" onPress={onClose}>
                                    Cancel
                                </Button>
                                <Button color="primary" onPress={() => handleTransaction(onClose)}>
                                    Confirm
                                </Button>
                            </ModalFooter>
                        </>
                    )}
                </ModalContent>
            </Modal>

            {/* Projects Tabs (Placeholder for now) */}
            <div className="flex w-full flex-col">
                <Tabs aria-label="Projects Options" color="primary" variant="underlined">
                    <Tab key="client" title="As Client">
                        <div className="pt-4 text-center py-10 text-default-500">
                            No active projects as client.
                        </div>
                    </Tab>
                    <Tab key="freelancer" title="As Freelancer">
                        <div className="pt-4 text-center py-10 text-default-500">
                            No active projects as freelancer.
                        </div>
                    </Tab>
                </Tabs>
            </div>
        </div>
    );
}
