"use client";

import { useState } from "react";
import {
    Modal,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalFooter,
} from "@heroui/modal";
import { Button } from "@heroui/button";
import { RadioGroup, Radio } from "@heroui/radio";

interface ResolutionModalProps {
    isOpen: boolean;
    onClose: () => void;
    onResolve: (decision: "Client" | "Freelancer" | "Split") => void;
    type: "AI" | "Human";
    loading: boolean;
}

export function ResolutionModal({
    isOpen,
    onClose,
    onResolve,
    type,
    loading,
}: ResolutionModalProps) {
    const [decision, setDecision] = useState<"Client" | "Freelancer" | "Split">("Client");

    const handleResolve = () => {
        onResolve(decision);
    };

    return (
        <Modal isOpen={isOpen} onOpenChange={onClose}>
            <ModalContent>
                {(onClose) => (
                    <>
                        <ModalHeader className="flex flex-col gap-1">
                            Simulate {type} Resolution
                        </ModalHeader>
                        <ModalBody>
                            <p className="text-default-500 mb-4">
                                Select the outcome of the dispute. In a real scenario, this would be determined by the {type === "AI" ? "AI agent" : "human arbitrator"}.
                            </p>
                            <RadioGroup
                                label="Decision"
                                value={decision}
                                onValueChange={(v) => setDecision(v as any)}
                            >
                                <Radio value="Client">Client Wins (Refund)</Radio>
                                <Radio value="Freelancer">Freelancer Wins (Full Payment)</Radio>
                                <Radio value="Split">Split (50/50)</Radio>
                            </RadioGroup>
                        </ModalBody>
                        <ModalFooter>
                            <Button color="danger" variant="light" onPress={onClose}>
                                Cancel
                            </Button>
                            <Button
                                color="primary"
                                onPress={handleResolve}
                                isLoading={loading}
                            >
                                Resolve
                            </Button>
                        </ModalFooter>
                    </>
                )}
            </ModalContent>
        </Modal>
    );
}
