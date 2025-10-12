// src/utils/poker.ts
export function potOdds(bet: number, pot: number): number {
  if (bet <= 0 || pot < 0) {
    throw new Error("Les valeurs du pot et du bet doivent être positives");
  }
  return bet / (pot + bet);
}

