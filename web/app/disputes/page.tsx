"use client";

import { useEffect, useState } from "react";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Chip } from "@heroui/chip";
import { Button } from "@heroui/button";
import { supabase } from "@/lib/supabase";

export default function DisputesPage() {
    const [disputes, setDisputes] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchDisputes();
    }, []);

    const fetchDisputes = async () => {
        try {
            const { data, error } = await supabase
                .from("disputes")
                .select("*, project:projects(title, payment_amount)")
                .order("created_at", { ascending: false });

            if (error) throw error;
            setDisputes(data || []);
        } catch (error) {
            console.error("Error fetching disputes:", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto pb-10">
            <div className="mb-8">
                <h1 className="text-3xl font-bold mb-2">Dispute Resolution Center</h1>
                <p className="text-default-500">
                    AI-powered arbitration with human oversight. Fair, transparent, and efficient.
                </p>
            </div>

            <div className="space-y-4">
                {loading ? (
                    <div className="text-center py-10">Loading disputes...</div>
                ) : disputes.length === 0 ? (
                    <div className="text-center py-10 text-default-500">No active disputes found.</div>
                ) : (
                    disputes.map((dispute) => (
                        <Card key={dispute.id} className="glass-card">
                            <CardBody className="flex flex-col md:flex-row justify-between gap-4 p-6">
                                <div className="space-y-2">
                                    <div className="flex items-center gap-3">
                                        <h3 className="text-xl font-bold">{dispute.project?.title}</h3>
                                        <Chip
                                            color={
                                                dispute.state === "pending" ? "warning" :
                                                    dispute.state === "resolved" ? "success" : "primary"
                                            }
                                            variant="flat"
                                            size="sm"
                                        >
                                            {dispute.state.replace("_", " ")}
                                        </Chip>
                                    </div>
                                    <p className="text-default-500">
                                        <span className="font-semibold text-foreground">Reason:</span> {dispute.reason}
                                    </p>
                                    <div className="flex gap-4 text-small text-default-400">
                                        <span>ID: {dispute.id.slice(0, 8)}...</span>
                                        <span>{new Date(dispute.created_at).toLocaleDateString()}</span>
                                    </div>
                                </div>

                                <div className="flex flex-col items-end justify-center gap-2 min-w-[150px]">
                                    <div className="text-right">
                                        <p className="text-tiny text-default-500 uppercase">Amount at Stake</p>
                                        <p className="text-xl font-bold text-danger">
                                            {(dispute.project?.payment_amount / 1000000).toLocaleString()} ₳
                                        </p>
                                    </div>
                                    <Button color="primary" variant="ghost" size="sm">
                                        View Details
                                    </Button>
                                </div>
                            </CardBody>
                        </Card>
                    ))
                )}
            </div>
        </div>
    );
}
