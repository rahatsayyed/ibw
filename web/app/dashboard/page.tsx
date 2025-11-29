"use client";

import { Card, CardBody, CardHeader } from "@heroui/card";
import { Tabs, Tab } from "@heroui/tabs";
import { Button } from "@heroui/button";
import { ProjectCard } from "@/components/project-card";

export default function DashboardPage() {
    // Mock Data
    const stats = [
        { label: "Total Balance", value: "2,450 ₳", color: "text-primary" },
        { label: "Available", value: "1,200 ₳", color: "text-success" },
        { label: "Locked", value: "1,250 ₳", color: "text-warning" },
        { label: "Reputation", value: "850", color: "text-secondary" },
    ];

    const clientProjects = [
        {
            id: "1",
            title: "DeFi Dashboard UI Implementation",
            description: "Need a skilled frontend dev to implement a Figma design...",
            payment: 1500,
            collateral: 10,
            deadline: "2023-12-31",
            status: "Open" as const,
            clientReputation: 450,
        },
    ];

    const freelancerProjects = [
        {
            id: "3",
            title: "NFT Collection Generator",
            description: "Create a tool to generate 10k NFT images...",
            payment: 2500,
            collateral: 10,
            deadline: "2024-01-20",
            status: "Accepted" as const,
            clientReputation: 580,
        },
    ];

    return (
        <div className="flex flex-col gap-8 pb-10">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold">Dashboard</h1>
                <div className="flex gap-2">
                    <Button color="primary" variant="flat">Deposit</Button>
                    <Button color="danger" variant="flat">Withdraw</Button>
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

            {/* Projects Tabs */}
            <div className="flex w-full flex-col">
                <Tabs aria-label="Projects Options" color="primary" variant="underlined" classNames={{
                    tabList: "gap-6 w-full relative rounded-none p-0 border-b border-divider",
                    cursor: "w-full bg-primary",
                    tab: "max-w-fit px-0 h-12",
                    tabContent: "group-data-[selected=true]:text-primary"
                }}>
                    <Tab key="client" title="As Client">
                        <div className="pt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {clientProjects.map((project) => (
                                <ProjectCard key={project.id} {...project} />
                            ))}
                            {clientProjects.length === 0 && (
                                <div className="col-span-full text-center py-10 text-default-500">
                                    No active projects as client.
                                </div>
                            )}
                        </div>
                    </Tab>
                    <Tab key="freelancer" title="As Freelancer">
                        <div className="pt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {freelancerProjects.map((project) => (
                                <ProjectCard key={project.id} {...project} />
                            ))}
                            {freelancerProjects.length === 0 && (
                                <div className="col-span-full text-center py-10 text-default-500">
                                    No active projects as freelancer.
                                </div>
                            )}
                        </div>
                    </Tab>
                    <Tab key="history" title="History">
                        <div className="pt-4 text-center py-10 text-default-500">
                            No completed projects yet.
                        </div>
                    </Tab>
                </Tabs>
            </div>
        </div>
    );
}
