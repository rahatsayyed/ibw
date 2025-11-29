"use client";

import { Table, TableHeader, TableColumn, TableBody, TableRow, TableCell } from "@heroui/table";
import { User } from "@heroui/user";
import { Chip } from "@heroui/chip";

export default function LeaderboardPage() {
    const freelancers = [
        {
            rank: 1,
            name: "Alice Dev",
            handle: "@alice_dev",
            reputation: 950,
            completed: 42,
            earnings: "45,000 ₳",
            avatar: "https://i.pravatar.cc/150?u=a042581f4e29026024d",
        },
        {
            rank: 2,
            name: "Bob Builder",
            handle: "@bob_builds",
            reputation: 880,
            completed: 35,
            earnings: "32,500 ₳",
            avatar: "https://i.pravatar.cc/150?u=a042581f4e29026704d",
        },
        {
            rank: 3,
            name: "Charlie Code",
            handle: "@charlie_c",
            reputation: 820,
            completed: 28,
            earnings: "28,000 ₳",
            avatar: "https://i.pravatar.cc/150?u=a04258114e29026302d",
        },
    ];

    return (
        <div className="max-w-5xl mx-auto pb-10">
            <div className="mb-8 text-center">
                <h1 className="text-4xl font-bold mb-2 bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary">
                    Hall of Fame
                </h1>
                <p className="text-default-500">
                    Top performing users on the Talendro platform.
                </p>
            </div>

            <div className="space-y-8">
                <div>
                    <h2 className="text-2xl font-bold mb-4">Top Freelancers</h2>
                    <Table aria-label="Top Freelancers Table" className="glass-card">
                        <TableHeader>
                            <TableColumn>RANK</TableColumn>
                            <TableColumn>USER</TableColumn>
                            <TableColumn>REPUTATION</TableColumn>
                            <TableColumn>COMPLETED PROJECTS</TableColumn>
                            <TableColumn>TOTAL EARNINGS</TableColumn>
                        </TableHeader>
                        <TableBody>
                            {freelancers.map((user) => (
                                <TableRow key={user.rank}>
                                    <TableCell>
                                        <span className={`text-xl font-bold ${user.rank === 1 ? "text-warning" : user.rank === 2 ? "text-default-400" : "text-amber-700"}`}>
                                            #{user.rank}
                                        </span>
                                    </TableCell>
                                    <TableCell>
                                        <User
                                            name={user.name}
                                            description={user.handle}
                                            avatarProps={{ src: user.avatar }}
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <Chip color="secondary" variant="flat" size="sm" className="font-bold">
                                            {user.reputation}
                                        </Chip>
                                    </TableCell>
                                    <TableCell>{user.completed}</TableCell>
                                    <TableCell className="font-bold text-success">{user.earnings}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </div>
        </div>
    );
}
