import { ProjectCard } from "@/components/project-card";
import { Input } from "@heroui/input";
import { Button } from "@heroui/button";
import { SearchIcon } from "@/components/icons";

export default function MarketplacePage() {
    // Mock Data
    const projects = [
        {
            id: "1",
            title: "DeFi Dashboard UI Implementation",
            description: "Need a skilled frontend dev to implement a Figma design for a DeFi dashboard using React and Tailwind.",
            payment: 1500,
            collateral: 10,
            deadline: "2023-12-31",
            status: "Open" as const,
            clientReputation: 450,
        },
        {
            id: "2",
            title: "Smart Contract Audit Script",
            description: "Write a Python script to automate basic security checks for Aiken smart contracts.",
            payment: 800,
            collateral: 5,
            deadline: "2023-11-15",
            status: "Open" as const,
            clientReputation: 320,
        },
        {
            id: "3",
            title: "NFT Collection Generator",
            description: "Create a tool to generate 10k NFT images from layers with rarity settings.",
            payment: 2500,
            collateral: 10,
            deadline: "2024-01-20",
            status: "Accepted" as const,
            clientReputation: 580,
        },
        {
            id: "4",
            title: "Cardano Wallet Integration",
            description: "Integrate Nami and Eternl wallet connection for a dApp.",
            payment: 500,
            collateral: 5,
            deadline: "2023-11-30",
            status: "Open" as const,
            clientReputation: 150,
        },
        {
            id: "5",
            title: "DAO Voting System",
            description: "Build a governance voting system using on-chain snapshots.",
            payment: 3000,
            collateral: 10,
            deadline: "2024-02-15",
            status: "Open" as const,
            clientReputation: 600,
        },
        {
            id: "6",
            title: "Token Vesting Portal",
            description: "Frontend for claiming vested tokens with schedule visualization.",
            payment: 1200,
            collateral: 5,
            deadline: "2023-12-10",
            status: "Submitted" as const,
            clientReputation: 410,
        },
    ];

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
                    />
                    <Button color="primary" className="h-12 px-8 font-bold shadow-lg shadow-primary/40">
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {projects.map((project) => (
                    <ProjectCard key={project.id} {...project} />
                ))}
            </div>
        </div>
    );
}
