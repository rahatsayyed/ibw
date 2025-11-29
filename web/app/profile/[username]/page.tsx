"use client";

import { useEffect, useState } from "react";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Button } from "@heroui/button";
import { Chip } from "@heroui/chip";
import { Divider } from "@heroui/divider";
import { Avatar } from "@heroui/avatar";
import { Tabs, Tab } from "@heroui/tabs";
import { GithubIcon } from "@/components/icons";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { ProjectCard } from "@/components/project-card";

export default function ProfilePage() {
    const params = useParams();
    const username = params.username;

    const [profile, setProfile] = useState<any>(null);
    const [projects, setProjects] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchProfile();
    }, [username]);

    const fetchProfile = async () => {
        try {
            // Fetch user profile
            const { data: userData, error: userError } = await supabase
                .from("users")
                .select("*")
                .eq("username", username)
                .single();

            if (userError) throw userError;
            setProfile(userData);

            // Fetch user projects (as client or freelancer)
            const { data: projectsData, error: projectsError } = await supabase
                .from("projects")
                .select("*, client:users!client_id(reputation_score)")
                .or(`client_id.eq.${userData.id},freelancer_id.eq.${userData.id}`)
                .order("created_at", { ascending: false });

            if (projectsError) throw projectsError;
            setProjects(projectsData || []);

        } catch (error) {
            console.error("Error fetching profile:", error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="p-10 text-center">Loading profile...</div>;
    if (!profile) return <div className="p-10 text-center">User not found</div>;

    return (
        <div className="max-w-5xl mx-auto pb-10">
            {/* Profile Header */}
            <Card className="glass-card mb-8">
                <CardBody className="flex flex-col md:flex-row gap-6 items-center md:items-start p-8">
                    <Avatar
                        src={profile.profile_image_url}
                        className="w-32 h-32 text-large"
                        isBordered
                        color="primary"
                    />
                    <div className="flex-grow text-center md:text-left space-y-2">
                        <div className="flex flex-col md:flex-row items-center gap-3">
                            <h1 className="text-3xl font-bold">{profile.username}</h1>
                            {profile.wallet_verified && (
                                <Chip color="success" variant="flat" size="sm">Verified Wallet</Chip>
                            )}
                        </div>
                        <p className="text-default-500 max-w-xl">
                            {profile.bio || "No bio provided."}
                        </p>
                        <div className="flex flex-wrap justify-center md:justify-start gap-2 pt-2">
                            <Chip variant="flat" color="secondary">Reputation: {profile.reputation_score}</Chip>
                            <Chip variant="flat" color="primary">Projects: {profile.total_projects_completed}</Chip>
                            <Chip variant="flat" color="warning">Balance: {(profile.total_balance / 1000000).toLocaleString()} ₳</Chip>
                        </div>
                    </div>
                    <div className="flex flex-col gap-2">
                        <Button color="primary" variant="shadow">Contact</Button>
                        <Button variant="bordered" startContent={<GithubIcon />}>GitHub</Button>
                    </div>
                </CardBody>
            </Card>

            {/* Projects Tabs */}
            <div className="flex w-full flex-col">
                <Tabs aria-label="User Projects" color="primary" variant="underlined">
                    <Tab key="all" title="All Projects">
                        <div className="pt-4 grid grid-cols-1 md:grid-cols-2 gap-6">
                            {projects.map((project) => (
                                <ProjectCard
                                    key={project.id}
                                    {...project}
                                    payment={project.payment_amount / 1000000}
                                    collateral={project.collateral_rate}
                                    clientReputation={project.client?.reputation_score || 0}
                                />
                            ))}
                            {projects.length === 0 && (
                                <div className="col-span-full text-center py-10 text-default-500">
                                    No projects found.
                                </div>
                            )}
                        </div>
                    </Tab>
                </Tabs>
            </div>
        </div>
    );
}
