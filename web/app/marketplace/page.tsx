"use client";

import { useEffect, useState } from "react";
import { ProjectCard } from "@/components/project-card";
import { Input } from "@heroui/input";
import { Button } from "@heroui/button";
import { SearchIcon } from "@/components/icons";
import { supabase } from "@/lib/supabase";

export default function MarketplacePage() {
    const [projects, setProjects] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");

    useEffect(() => {
        fetchProjects();
    }, []);

    const fetchProjects = async () => {
        try {
            let query = supabase
                .from("projects")
                .select("*, client:users!client_id(reputation)")
                .eq("status", "Open")
                .order("created_at", { ascending: false });

            if (search) {
                query = query.ilike("title", `%${search}%`);
            }

            const { data, error } = await query;
            if (error) throw error;
            setProjects(data || []);
        } catch (error) {
            console.error("Error fetching projects:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = () => {
        setLoading(true);
        fetchProjects();
    };

    return (
        <div className="flex flex-col gap-8 pb-10">
            {/* Hero Section */}
            <section className="flex flex-col items-center justify-center py-12 text-center space-y-4">
                <h1 className="text-4xl md:text-6xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary animate-in fade-in slide-in-from-bottom-4 duration-1000">
                    Find Work. Build Trust.
                </h1>
                <p className="text-xl text-default-500 max-w-2xl">
                    The decentralized marketplace for Cardano developers. Secure payments, automated disputes, and on-chain reputation.
                </p>

                <div className="w-full max-w-xl mt-8 flex gap-2">
                    <Input
                        classNames={{
                            base: "max-w-full sm:max-w-[20rem] h-12",
                            mainWrapper: "h-full",
                            input: "text-small",
                            inputWrapper: "h-full font-normal text-default-500 bg-default-400/20 dark:bg-default-500/20",
                        }}
                        placeholder="Search projects..."
                        size="sm"
                        startContent={<SearchIcon size={18} />}
                        type="search"
                        value={search}
                        onValueChange={setSearch}
                        onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                    />
                    <Button
                        color="primary"
                        className="h-12 px-8 font-bold shadow-lg shadow-primary/40"
                        onPress={handleSearch}
                    >
                        Search
                    </Button>
                </div>
            </section>

            {/* Filters (Visual Only) */}
            <div className="flex gap-2 overflow-x-auto pb-2">
                {["All", "Development", "Design", "Marketing", "Writing", "Audit"].map((filter) => (
                    <Button key={filter} variant="flat" size="sm" className="rounded-full">
                        {filter}
                    </Button>
                ))}
            </div>

            {/* Project Grid */}
            {loading ? (
                <div className="text-center py-10">Loading projects...</div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {projects.map((project) => (
                        <ProjectCard
                            key={project.id}
                            {...project}
                            payment={project.payment_amount}
                            collateral={project.collateral_rate}
                            clientReputation={project.client?.reputation || 0}
                        />
                    ))}
                    {projects.length === 0 && (
                        <div className="col-span-full text-center py-10 text-default-500">
                            No projects found.
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
