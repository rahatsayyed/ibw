"use client";

import { Card, CardBody, CardHeader } from "@heroui/card";
import { Avatar } from "@heroui/avatar";
import { Chip } from "@heroui/chip";
import { Button } from "@heroui/button";
import { Divider } from "@heroui/divider";
import { useParams } from "next/navigation";

export default function ProfilePage() {
    const params = useParams();
    const username = params.username;

    // Mock Data
    const user = {
        username: username || "alice_dev",
        name: "Alice Dev",
        bio: "Full-stack developer specializing in Cardano and React. Building dApps since 2021.",
        avatar: "https://i.pravatar.cc/150?u=a042581f4e29026024d",
        reputation: 950,
        joined: "Sep 2023",
        skills: ["React", "Next.js", "Tailwind", "Aiken", "Lucid"],
        stats: {
            completed: 42,
            disputes: 0,
            earnings: "45,000 ₳",
        }
    };

    return (
        <div className="max-w-4xl mx-auto pb-10">
            <Card className="glass-card overflow-visible">
                <div className="h-32 bg-gradient-to-r from-primary/20 to-secondary/20 rounded-t-xl"></div>
                <CardBody className="px-8 pb-8">
                    <div className="flex flex-col md:flex-row justify-between items-start -mt-12 mb-6">
                        <div className="flex flex-col gap-4">
                            <Avatar
                                src={user.avatar}
                                className="w-24 h-24 text-large border-4 border-background"
                            />
                            <div>
                                <h1 className="text-2xl font-bold">{user.name}</h1>
                                <p className="text-default-500">@{user.username}</p>
                            </div>
                        </div>
                        <div className="mt-14 md:mt-0 flex gap-2">
                            <Button color="primary">Hire Me</Button>
                            <Button variant="bordered">Message</Button>
                        </div>
                    </div>

                    <p className="text-default-500 mb-6 max-w-2xl">
                        {user.bio}
                    </p>

                    <div className="flex flex-wrap gap-2 mb-8">
                        {user.skills.map(skill => (
                            <Chip key={skill} variant="flat" size="sm">{skill}</Chip>
                        ))}
                    </div>

                    <Divider className="my-6" />

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                        <div>
                            <p className="text-2xl font-bold text-secondary">{user.reputation}</p>
                            <p className="text-tiny text-default-500 uppercase">Reputation</p>
                        </div>
                        <div>
                            <p className="text-2xl font-bold">{user.stats.completed}</p>
                            <p className="text-tiny text-default-500 uppercase">Projects</p>
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-success">{user.stats.earnings}</p>
                            <p className="text-tiny text-default-500 uppercase">Earnings</p>
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-danger">{user.stats.disputes}</p>
                            <p className="text-tiny text-default-500 uppercase">Disputes</p>
                        </div>
                    </div>
                </CardBody>
            </Card>
        </div>
    );
}
