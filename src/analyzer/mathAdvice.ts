// src/analyzer/mathAdvice.ts
import chalk from "chalk";

/**
 * getMathAdvice(handText, meta)
 * - Tout en ORANGE
 * - Ton/format "cours de lycée"
 * - Donne : rappel simple + calcul étape par étape + exemple d'erreur de maths (EV/range/fold equity)
 */
export function getMathAdvice(handText: string, meta: Record<string, any>): string {
  const orange = (s: string) => chalk.hex("#FFA500")(s); // tout en orange
  const title = chalk.bgHex("#FFA500").black.bold(" 🧮 CONSEIL MATHÉMATIQUE (mode scolaire) ");
  const sep = chalk.hex("#FFA500")("────────────────────────────────────────────────────────");

  const pot = Number(meta?.pot ?? 0);
  const toCall = Number(meta?.toCall ?? 0);
  const potOdds = Number(meta?.potOdds ?? 0); // ex: 0.25 = 25%

  if (!pot || !toCall) {
    return `\n${title}\n${sep}\n${orange(
      "Pas de calcul possible cette fois (montant du pot ou mise à payer manquant)."
    )}\n${sep}\n`;
  }

  // 1) Rappel simple
  // Pot odds % = mise à payer / (pot total après ton call)
  const totalIfCall = pot + toCall;
  const requiredEquity = (toCall / totalIfCall) * 100; // ce que tu dois gagner au minimum
  const shownOdds = potOdds ? (potOdds * 100) : requiredEquity;

  // 2) Exemple concret depuis la main
  // On affiche un "pas à pas" très explicite.
  const stepByStep =
    `${orange("1) Pot actuel :")} ${orange(pot.toFixed(2))}\n` +
    `${orange("2) Mise à payer (to call) :")} ${orange(toCall.toFixed(2))}\n` +
    `${orange("3) Pot total si tu payes :")} ${orange(`${pot.toFixed(2)} + ${toCall.toFixed(2)} = ${totalIfCall.toFixed(2)}`)}\n` +
    `${orange("4) Pot odds (≈ % minimum de victoire requis) :")} ${orange(`${toCall.toFixed(2)} / ${totalIfCall.toFixed(2)} = ${requiredEquity.toFixed(1)}%`)}`;

  // 3) Erreur de maths illustrée (ex EV / Range / Fold equity)
  // On fabrique un exemple pédagogique ultra simple :
  //  - Si requiredEquity ≈ 25%, on montre "rule of 2 et 4" avec 8 outs → 32% au turn (≈ call OK)
  //  - Sinon on prend un exemple d'overcard (≈ 6 clean outs ~ 12% au turn, donc fold souvent).
  let errorBlock = "";
  if (requiredEquity >= 22 && requiredEquity <= 28) {
    errorBlock =
      `${orange("❌ Erreur fréquente (EV) :")} croire que payer est mauvais alors que tu as assez d’outs.\n` +
      `${orange("Exemple :")} tu penses avoir un tirage (≈ 8 outs). ${orange("Règle du 2 et 4")} → au turn ≈ 8 × 2 = 16% ; à la river ≈ 8 × 4 = 32%.\n` +
      `${orange("Comparaison :")} il faut ≈ ${requiredEquity.toFixed(1)}% (pot odds), ton tirage donne ≈ 32% à la river → ${orange("CALL correct sur un seul barrel")}. (EV = espérance de gain)\n`;
  } else {
    errorBlock =
      `${orange("❌ Erreur fréquente (Range/Fold equity) :")} payer hors position avec une simple overcard en pensant avoir “beaucoup d’équité”.\n` +
      `${orange("Exemple :")} avec ~6 outs crédibles → au turn ≈ 6 × 2 = 12% seulement.\n` +
      `${orange("Comparaison :")} il faut ≈ ${requiredEquity.toFixed(1)}%, tu n’as que ≈ 12% → ${orange("FOLD est souvent meilleur")}.\n` +
      `${orange("(Range = ensemble de mains probables chez vilain ; Fold equity = chances qu’il se couche si tu mises/relances)")}\n`;
  }

  // 4) Astuce “de tête”
  const mental =
    `${orange("💡 Astuce de tête :")} retiens ${orange("Règle du 2 et 4")}. ` +
    `${orange("Turn")} : outs × 2 ≈ % d’amélioration ; ${orange("Flop→River")} : outs × 4 ≈ %.\n` +
    `${orange("Ex : 9 outs")} ⇒ ≈ 18% (turn) ou 36% (flop→river). Compare ce % au ${orange("minimum requis")} (${requiredEquity.toFixed(1)}%).`;

  return `\n${title}\n${sep}\n${orange(
    "Objectif : comparer ce qu’il faut pour que le call soit rentable (EV ≥ 0) au pourcentage de victoire réaliste."
  )}\n\n${stepByStep}\n\n${errorBlock}${mental}\n${sep}\n`;
}
