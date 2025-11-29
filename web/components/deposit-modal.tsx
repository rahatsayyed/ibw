"use client";

import { useState, useEffect } from "react";
import {
    Modal,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalFooter,
} from "@heroui/modal";
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";

interface DepositModalProps {
    isOpen: boolean;
    onClose: () => void;
    missingAmount: number;
    onSuccess: () => void;
}

export function DepositModal({
    isOpen,
    onClose,
    missingAmount,
    onSuccess,
}: DepositModalProps) {
    const { user, userProfile } = useAuth();
    const [amount, setAmount] = useState(missingAmount.toString());
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        if (isOpen) {
            setAmount(missingAmount.toString());
            setError("");
        }
    }, [isOpen, missingAmount]);

    const handleAmountChange = (value: string) => {
        setAmount(value);
        const val = Number(value);
        if (isNaN(val)) {
            setError("Please enter a valid number");
        } else if (val < missingAmount) {
            setError(`Minimum required deposit is ${missingAmount} ADA`);
        } else {
            setError("");
        }
    };

    const handleDeposit = async () => {
        const val = Number(amount);
        if (isNaN(val) || val < missingAmount) {
            setError(`Minimum required deposit is ${missingAmount} ADA`);
            return;
        }

        setLoading(true);
        try {
            const userId = user?.id || userProfile?.id;
            if (!userId) throw new Error("User not found");

            // Get current balance first to ensure atomicity (in a real app)
            const { data: profile, error: fetchError } = await supabase
                .from("users")
                .select("total_balance, available_balance")
                .eq("id", userId)
                .single();

            if (fetchError) throw fetchError;

            const newBalance = Number(profile.total_balance) + val * 1000000;
            const newAvailable = Number(profile.available_balance) + val * 1000000;

            const { error: updateError } = await supabase
                .from("users")
                .update({
                    total_balance: newBalance,
                    available_balance: newAvailable,
                })
                .eq("id", userId);

            if (updateError) throw updateError;

            toast.success(`Successfully deposited ${val} ADA`);
            onSuccess();
            onClose();
        } catch (err: any) {
            console.error("Deposit error:", err);
            toast.error(err.message || "Failed to deposit funds");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onOpenChange={onClose}>
            <ModalContent>
                {(onClose) => (
                    <>
                        <ModalHeader className="flex flex-col gap-1">
                            Insufficient Balance
                        </ModalHeader>
                        <ModalBody>
                            <p className="text-default-500 mb-2">
                                You need to deposit funds to proceed with this action.
                            </p>
                            <Input
                                label="Deposit Amount"
                                placeholder="0.00"
                                type="number"
                                variant="bordered"
                                endContent={
                                    <span className="text-default-400 text-small">₳</span>
                                }
                                value={amount}
                                onValueChange={handleAmountChange}
                                errorMessage={error}
                                isInvalid={!!error}
                            />
                            <p className="text-tiny text-default-400">
                                Required amount: {missingAmount} ADA
                            </p>
                        </ModalBody>
                        <ModalFooter>
                            <Button color="danger" variant="light" onPress={onClose}>
                                Cancel
                            </Button>
                            <Button
                                color="primary"
                                onPress={handleDeposit}
                                isLoading={loading}
                                isDisabled={!!error}
                            >
                                Deposit & Continue
                            </Button>
                        </ModalFooter>
                    </>
                )}
            </ModalContent>
        </Modal>
    );
}
