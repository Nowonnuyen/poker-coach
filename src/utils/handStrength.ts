export type HandStrength = {
  label: string;
  score: number;
};

/**
 * Convertit une carte en valeur numérique
 */
function rankToNumber(rank: string): number {
  if (rank === 'A') return 14;
  if (rank === 'K') return 13;
  if (rank === 'Q') return 12;
  if (rank === 'J') return 11;
  return parseInt(rank);
}

/**
 * Vérifie si un tableau de valeurs est une suite
 */
function isStraight(values: number[]): boolean {
  values.sort((a, b) => a - b);
  for (let i = 1; i < values.length; i++) {
    if (values[i] !== values[i - 1] + 1) return false;
  }
  return true;
}

/**
 * Vérifie si toutes les cartes ont la même couleur
 */
function isFlush(suits: string[]): boolean {
  return suits.every(s => s === suits[0]);
}

/**
 * Évalue la force d'une main de poker
 */
export function evaluateHandStrength(cards: string[]): HandStrength {
  const ranks: string[] = [];
  const suits: string[] = [];

  cards.forEach(card => {
    ranks.push(card.slice(0, -1));
    suits.push(card.slice(-1));
  });

  const values = ranks.map(rankToNumber);
  const rankCounts: Record<number, number> = {};
  values.forEach(v => (rankCounts[v] = (rankCounts[v] || 0) + 1));
  const counts = Object.values(rankCounts).sort((a, b) => b - a);

  const flush = isFlush(suits);
  const straight = isStraight([...new Set(values)]);

  let label = 'high card';
  let score = 0;

  if (straight && flush && Math.max(...values) === 14) {
    label = 'royal flush';
    score = 1;
  } else if (straight && flush) {
    label = 'straight flush';
    score = 0.98;
  } else if (counts[0] === 4) {
    label = 'four of a kind';
    score = 0.95;
  } else if (counts[0] === 3 && counts[1] === 2) {
    label = 'full house';
    score = 0.9;
  } else if (flush) {
    label = 'flush';
    score = 0.85;
  } else if (straight) {
    label = 'straight';
    score = 0.8;
  } else if (counts[0] === 3) {
    label = 'three of a kind';
    score = 0.7;
  } else if (counts[0] === 2 && counts[1] === 2) {
    label = 'two pair';
    score = 0.6;
  } else if (counts[0] === 2) {
    label = 'pair';
    score = 0.45;
  }

  return { label, score };
}

