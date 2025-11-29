import { generateEmulatorAccount, Emulator } from "@lucid-evolution/lucid";

export const accountA = generateEmulatorAccount({ lovelace: 10_000_000_000n });
export const accountB = generateEmulatorAccount({ lovelace: 10_000_000_000n });
export const accountC = generateEmulatorAccount({ lovelace: 10_000_000_000n });
export const accountD = generateEmulatorAccount({ lovelace: 10_000_000_000n });

export const emulator = new Emulator([accountA, accountB, accountC, accountD]);
