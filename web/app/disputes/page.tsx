"use client";

import { Card, CardBody, CardHeader } from "@heroui/card";
import { Chip } from "@heroui/chip";
import { Button } from "@heroui/button";
import { Divider } from "@heroui/divider";

export default function DisputesPage() {
    const disputes = [
        {
            id: "D-102",
            projectTitle: "E-commerce Payment Gateway",
            reason: "Freelancer delivered incomplete code that fails security tests.",
            status: "AI Analysis",
            amount: 2000,
            date: "2023-11-28",
        },
        {
            id: "D-098",
            projectTitle: "Landing Page Redesign",
            reason: "Client refuses to release funds despite pixel-perfect delivery.",
            status: "Human Review",
            amount: 500,
            date: "2023-11-25",
        },
    ];

    return (
        <div className="max-w-4xl mx-auto pb-10">
            <div className="mb-8">
                <h1 className="text-3xl font-bold mb-2">Dispute Resolution Center</h1>
                <p className="text-default-500">
                    Fair, transparent, and AI-powered dispute resolution.
                </p>
            </div>

            <div className="flex flex-col gap-4">
                {disputes.map((dispute) => (
                    <Card key={dispute.id} className="glass-card">
                        <CardBody>
                            <div className="flex flex-col md:flex-row justify-between gap-4">
                                <div className="flex-grow">
                                    <div className="flex justify-between items-start mb-2">
                                        <h3 className="text-xl font-bold">{dispute.projectTitle}</h3>
                                        <Chip
                                            color={dispute.status === "AI Analysis" ? "secondary" : "warning"}
                                            variant="flat"
                                        >
                                            {dispute.status}
                                        </Chip>
                                    </div>
                                    <p className="text-default-500 mb-2">
                                        <span className="font-semibold text-foreground">Dispute Reason:</span> {dispute.reason}
                                    </p>
                                    <div className="flex gap-4 text-small text-default-400">
                                        <span>ID: {dispute.id}</span>
                                        <span>Date: {dispute.date}</span>
                                        <span>Amount: {dispute.amount} ₳</span>
                                    </div>
                                </div>
                                <div className="flex flex-col justify-center gap-2 min-w-[150px]">
                                    <Button color="primary" variant="ghost">
                                        View Details
                                    </Button>
                                </div>
                            </div>
                        </CardBody>
                    </Card>
                ))}
            </div>
        </div>
    );
}
