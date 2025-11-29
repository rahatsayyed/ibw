"use client";

import { useEffect, useState, useCallback } from "react";
import { ProjectCard } from "@/components/project-card";
import { Input } from "@heroui/input";
import { Button } from "@heroui/button";
import { Slider } from "@heroui/slider";
import { SearchIcon, FilterIcon } from "@/components/icons";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import { useSearchParams } from "next/navigation";
import {
    Popover,
    PopoverTrigger,
    PopoverContent,
} from "@heroui/popover";
import { Chip } from "@heroui/chip";

export default function MarketplacePage() {
    const { user, userProfile } = useAuth();
    const searchParams = useSearchParams();
    const filterParam = searchParams.get("filter");

    const [projects, setProjects] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");

    // Filters
    const [minPrice, setMinPrice] = useState<number>(0);
    const [maxPrice, setMaxPrice] = useState<number>(10000);
    const [minReputation, setMinReputation] = useState<number>(0);
    const [skills, setSkills] = useState("");

    const fetchProjects = useCallback(async () => {
        setLoading(true);
        try {
            let query = supabase
                .from("projects")
                .select("*, client:users!client_id!inner(reputation_score)");

            const userId = user?.id || userProfile?.id;

            // Main Context Filters
            if (filterParam === "my_projects" && userId) {
                query = query.eq("client_id", userId);
            } else if (filterParam === "accepted_projects" && userId) {
                query = query.eq("freelancer_id", userId);
            } else {
                // Default Gigs View
                query = query.eq("status", "open");
            }

            // Search
            if (search) {
                query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`);
            }

            // Skills Filter (searching in description/title as proxy)
            if (skills) {
                query = query.or(`title.ilike.%${skills}%,description.ilike.%${skills}%`);
            }

            // Price Filter (ADA to Lovelace)
            if (minPrice > 0) {
                query = query.gte("payment_amount", minPrice * 1000000);
            }
            if (maxPrice < 10000) {
                query = query.lte("payment_amount", maxPrice * 1000000);
            }

            // Reputation Filter
            if (minReputation > 0) {
                query = query.gte("client.reputation_score", minReputation);
            }

            query = query.order("created_at", { ascending: false });

            const { data, error } = await query;
            if (error) throw error;
            setProjects(data || []);
        } catch (error) {
            console.error("Error fetching projects:", error);
        } finally {
            setLoading(false);
        }
    }, [filterParam, user, userProfile, search, skills, minPrice, maxPrice, minReputation]);

    useEffect(() => {
        fetchProjects();
    }, [fetchProjects]);

    const handleSearch = () => {
        fetchProjects();
    };

    const getPageTitle = () => {
        if (filterParam === "my_projects") return "My Projects";
        if (filterParam === "accepted_projects") return "Accepted Projects";
        return "Find Work. Build Trust.";
    };

    const getPageDescription = () => {
        if (filterParam === "my_projects") return "Manage the projects you have created.";
        if (filterParam === "accepted_projects") return "Track the projects you are working on.";
        return "The decentralized marketplace for Cardano developers. Secure payments, automated disputes, and on-chain reputation.";
    };

    const clearAllFilters = () => {
        setMinPrice(0);
        setMaxPrice(10000);
        setMinReputation(0);
        setSkills("");
    };

    const hasActiveFilters = minPrice > 0 || maxPrice < 10000 || minReputation > 0 || skills !== "";

    return (
        <div className="flex flex-col gap-8 pb-10">
            {/* Hero Section */}
            <section className="flex flex-col items-center justify-center py-12 text-center space-y-4">
                <h1 className="text-4xl md:text-6xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary animate-in fade-in slide-in-from-bottom-4 duration-1000">
                    {getPageTitle()}
                </h1>
                <p className="text-xl text-default-500 max-w-2xl">
                    {getPageDescription()}
                </p>

                <div className="w-full max-w-xl mt-8 flex gap-2">
                    <Input
                        classNames={{
                            base: "max-w-full sm:max-w-[20rem] h-12",
                            mainWrapper: "h-full",
                            input: "text-small",
                            inputWrapper:
                                "h-full font-normal text-default-500 bg-default-400/20 dark:bg-default-500/20",
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

            {/* Filters Section */}
            <div className="flex flex-col gap-4">
                <div className="flex items-center gap-2">
                    <Popover placement="bottom-start">
                        <PopoverTrigger>
                            <Button
                                variant="flat"
                                startContent={<FilterIcon />}
                                className="font-medium"
                            >
                                Filters
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[340px] p-4">
                            <div className="flex flex-col gap-4 w-full">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Price Range (ADA)</label>
                                    <div className="flex gap-2 items-center">
                                        <Input
                                            type="number"
                                            placeholder="Min"
                                            value={minPrice.toString()}
                                            onValueChange={(v) => setMinPrice(Number(v))}
                                            size="sm"
                                            label="Min"
                                        />
                                        <span>-</span>
                                        <Input
                                            type="number"
                                            placeholder="Max"
                                            value={maxPrice.toString()}
                                            onValueChange={(v) => setMaxPrice(Number(v))}
                                            size="sm"
                                            label="Max"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Min Client Reputation</label>
                                    <Slider
                                        size="sm"
                                        step={10}
                                        maxValue={1000}
                                        minValue={0}
                                        defaultValue={0}
                                        value={minReputation}
                                        onChange={(v) => setMinReputation(Number(v))}
                                        className="max-w-md"
                                    />
                                    <div className="text-small text-default-500 text-right">{minReputation}</div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Skills (Keywords)</label>
                                    <Input
                                        placeholder="e.g. React, Rust, Plutus"
                                        value={skills}
                                        onValueChange={setSkills}
                                        size="sm"
                                    />
                                </div>
                            </div>
                        </PopoverContent>
                    </Popover>

                    {/* Active Filter Chips */}
                    <div className="flex flex-wrap gap-2 items-center">
                        {minPrice > 0 && (
                            <Chip onClose={() => setMinPrice(0)} variant="flat" color="secondary">
                                Min Price: {minPrice} ADA
                            </Chip>
                        )}
                        {maxPrice < 10000 && (
                            <Chip onClose={() => setMaxPrice(10000)} variant="flat" color="secondary">
                                Max Price: {maxPrice} ADA
                            </Chip>
                        )}
                        {minReputation > 0 && (
                            <Chip onClose={() => setMinReputation(0)} variant="flat" color="secondary">
                                Reputation &gt; {minReputation}
                            </Chip>
                        )}
                        {skills && (
                            <Chip onClose={() => setSkills("")} variant="flat" color="secondary">
                                Skills: {skills}
                            </Chip>
                        )}

                        {hasActiveFilters && (
                            <Button
                                size="sm"
                                variant="light"
                                color="danger"
                                onPress={clearAllFilters}
                                className="ml-2"
                            >
                                Clear All
                            </Button>
                        )}
                    </div>
                </div>
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
            )}
        </div>
    );
}
