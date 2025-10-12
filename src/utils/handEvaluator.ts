// src/utils/handEvaluator.ts

export function evaluateHand(hand: string[]): string {
  // Exemple simplifié : retourne "High Card" si aucune combinaison
  if (!hand || hand.length === 0) {
    throw new Error("La main ne peut pas être vide");
  }
  // Ici tu pourras plus tard ajouter des vérifications pour paires, brelans, etc.
  return "High Card";
}

