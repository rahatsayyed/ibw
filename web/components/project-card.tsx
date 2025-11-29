"use client";

import { Card, CardBody, CardFooter, CardHeader } from "@heroui/card";
import { Chip } from "@heroui/chip";
import { Button } from "@heroui/button";
import { Divider } from "@heroui/divider";
import Link from "next/link";

interface ProjectCardProps {
    id: string;
    title: string;
    description: string;
    payment: number;
    collateral: number;
    deadline: string;
    status: "Open" | "Accepted" | "Submitted" | "Completed" | "Disputed";
    clientReputation: number;
}

export const ProjectCard = ({
    id,
    title,
    description,
    payment,
    collateral,
    deadline,
    status,
    clientReputation,
}: ProjectCardProps) => {
    const statusColor = {
        Open: "success",
        Accepted: "primary",
        Submitted: "warning",
        Completed: "secondary",
        Disputed: "danger",
    }[status] as "success" | "primary" | "warning" | "secondary" | "danger";

    return (
        <Card className="glass-card hover:scale-[1.02] transition-transform duration-200">
            <CardHeader className="flex justify-between items-start">
                <div className="flex flex-col gap-1">
                    <h4 className="text-lg font-bold text-primary">{title}</h4>
                    <p className="text-small text-default-500">Client Rep: {clientReputation}</p>
                </div>
                <Chip color={statusColor} variant="flat" size="sm">
                    {status}
                </Chip>
            </CardHeader>
            <Divider />
            <CardBody>
                <p className="text-small text-default-500 line-clamp-3 mb-4">
                    {description}
                </p>
                <div className="flex justify-between items-center text-small">
                    <div className="flex flex-col">
                        <span className="text-default-400">Payment</span>
                        <span className="font-bold text-lg">{payment} ₳</span>
                    </div>
                    <div className="flex flex-col items-end">
                        <span className="text-default-400">Collateral</span>
                        <span className="font-bold">{collateral}%</span>
                    </div>
                </div>
            </CardBody>
            <Divider />
            <CardFooter className="flex justify-between items-center">
                <div className="text-tiny text-default-400">
                    Due: {new Date(deadline).toLocaleDateString()}
                </div>
                <Button
                    as={Link}
                    href={`/projects/${id}`}
                    color="primary"
                    variant="ghost"
                    size="sm"
                    className="font-semibold"
                >
                    View Details
                </Button>
            </CardFooter>
        </Card>
    );
};
