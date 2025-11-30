import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

import { blake2b } from 'blakejs'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function hashString(input: string): string {
  const hash = blake2b(input, undefined, 32);
  return Buffer.from(hash).toString('hex');
}
