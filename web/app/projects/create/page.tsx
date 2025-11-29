"use client";

import { Input, Textarea } from "@heroui/input";
import { Button } from "@heroui/button";
import { Select, SelectItem } from "@heroui/select";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Divider } from "@heroui/divider";
import { Slider } from "@heroui/slider";

export default function CreateProjectPage() {
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
                            />
                            <Textarea
                                label="Description"
                                placeholder="Describe the project requirements in detail..."
                                variant="bordered"
                                minRows={5}
                                isRequired
                            />
                            <Textarea
                                label="Success Criteria"
                                placeholder="What defines a completed project? Be specific."
                                variant="bordered"
                                minRows={3}
                                isRequired
                            />
                            <Input
                                label="GitHub Repository URL"
                                placeholder="https://github.com/username/repo"
                                variant="bordered"
                                startContent={<span className="text-default-400 text-small">github.com/</span>}
                                isRequired
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
                                />
                                <Select
                                    label="Collateral Rate"
                                    placeholder="Select rate"
                                    variant="bordered"
                                    isRequired
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
                                        {
                                            value: 50,
                                            label: "50%",
                                        },
                                        {
                                            value: 80,
                                            label: "80%",
                                        },
                                        {
                                            value: 100,
                                            label: "100%",
                                        },
                                    ]}
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
                                <span className="font-semibold">0 ₳</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-default-500">Platform Fee (2%)</span>
                                <span className="font-semibold">0 ₳</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-default-500">Reserve Deposit</span>
                                <span className="font-semibold">25 ₳</span>
                            </div>
                            <Divider />
                            <div className="flex justify-between text-lg font-bold text-primary">
                                <span>Total Cost</span>
                                <span>25 ₳</span>
                            </div>

                            <Button color="primary" className="w-full font-bold shadow-lg shadow-primary/40 mt-4">
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
