"use client";

import { Button } from "@heroui/button";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Chip } from "@heroui/chip";
import { Divider } from "@heroui/divider";
import { User } from "@heroui/user";
import { GithubIcon } from "@/components/icons";
import { useParams } from "next/navigation";

export default function ProjectDetailsPage() {
    const params = useParams();
    const id = params.id;

    // Mock Data
    const project = {
        id: id,
        title: "DeFi Dashboard UI Implementation",
        description: "We need a skilled frontend developer to implement a Figma design for a DeFi dashboard using React and Tailwind CSS. The dashboard should include wallet connection, token swapping interface, and yield farming stats. The design is fully responsive and dark mode ready.",
        criteria: "1. Pixel-perfect implementation of Figma designs.\n2. Fully responsive on mobile and desktop.\n3. Clean, modular code using functional components.\n4. Integration with mock data for demonstration.",
        repo: "https://github.com/client/defi-dashboard",
        payment: 1500,
        collateral: 10,
        deadline: "2023-12-31",
        status: "Open",
        client: {
            name: "Alice Crypto",
            handle: "@alice_dev",
            avatar: "https://i.pravatar.cc/150?u=a042581f4e29026024d",
            reputation: 450,
        },
        freelancer: null,
    };

    return (
        <div className="max-w-5xl mx-auto pb-10">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <h1 className="text-3xl font-bold">{project.title}</h1>
                        <Chip color="success" variant="flat">{project.status}</Chip>
                    </div>
                    <div className="flex items-center gap-2 text-default-500">
                        <span>Posted by</span>
                        <User
                            name={project.client.name}
                            description={project.client.handle}
                            avatarProps={{
                                src: project.client.avatar
                            }}
                            className="scale-90 origin-left"
                        />
                    </div>
                </div>
                <div className="flex gap-3">
                    <Button variant="bordered" startContent={<GithubIcon />}>
                        View Repo
                    </Button>
                    <Button color="primary" className="font-bold shadow-lg shadow-primary/40">
                        Accept Project
                    </Button>
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
                                {project.criteria}
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
                                <span className="text-2xl font-bold text-primary">{project.payment} ₳</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-default-500">Collateral Required</span>
                                <span className="font-semibold text-warning">{project.collateral}% (150 ₳)</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-default-500">Deadline</span>
                                <span>{new Date(project.deadline).toLocaleDateString()}</span>
                            </div>
                        </CardBody>
                    </Card>

                    <Card className="glass-card p-4 bg-primary/5 border-primary/20">
                        <CardHeader>
                            <h3 className="text-lg font-bold text-primary">Freelancer Action</h3>
                        </CardHeader>
                        <Divider className="my-2" />
                        <CardBody>
                            <p className="text-small text-default-500 mb-4">
                                To accept this project, you must lock <strong>150 ₳</strong> as collateral. This ensures commitment to the deadline.
                            </p>
                            <Button color="primary" className="w-full font-bold">
                                Lock Collateral & Accept
                            </Button>
                        </CardBody>
                    </Card>
                </div>
            </div>
        </div>
    );
}
