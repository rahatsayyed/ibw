"use client";

import { useEffect, useState } from "react";
import { Table, TableHeader, TableColumn, TableBody, TableRow, TableCell } from "@heroui/table";
import { User } from "@heroui/user";
import { Chip } from "@heroui/chip";
import { supabase } from "@/lib/supabase";

export default function LeaderboardPage() {
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchLeaderboard();
    }, []);

    const fetchLeaderboard = async () => {
        try {
            const { data, error } = await supabase
                .from("users")
                .select("*")
                .order("reputation_score", { ascending: false })
                .limit(20);

            if (error) throw error;
            setUsers(data || []);
        } catch (error) {
            console.error("Error fetching leaderboard:", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-5xl mx-auto pb-10">
            <div className="mb-8 text-center">
                <h1 className="text-3xl font-bold mb-2">Top Freelancers</h1>
                <p className="text-default-500">
                    Recognizing the most trusted and skilled contributors in the ecosystem.
                </p>
            </div>

            <Table aria-label="Leaderboard table">
                <TableHeader>
                    <TableColumn>RANK</TableColumn>
                    <TableColumn>USER</TableColumn>
                    <TableColumn>REPUTATION</TableColumn>
                    <TableColumn>PROJECTS</TableColumn>
                    <TableColumn>TOTAL BALANCE</TableColumn>
                </TableHeader>
                <TableBody isLoading={loading} emptyContent={"No users found."}>
                    {users.map((user, index) => (
                        <TableRow key={user.id}>
                            <TableCell>
                                <div className={`font-bold text-xl ${index < 3 ? "text-warning" : "text-default-500"}`}>
                                    #{index + 1}
                                </div>
                            </TableCell>
                            <TableCell>
                                <User
                                    name={user.username}
                                    description={user.wallet_address ? `${user.wallet_address.slice(0, 6)}...${user.wallet_address.slice(-4)}` : "No Wallet"}
                                    avatarProps={{
                                        src: user.profile_image_url
                                    }}
                                />
                            </TableCell>
                            <TableCell>
                                <Chip color="secondary" variant="flat" className="font-bold">
                                    {user.reputation_score}
                                </Chip>
                            </TableCell>
                            <TableCell>
                                <div className="font-semibold">{user.total_projects_completed}</div>
                            </TableCell>
                            <TableCell>
                                <div className="font-bold text-success">{(user.total_balance / 1000000).toLocaleString()} ₳</div>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    );
}
