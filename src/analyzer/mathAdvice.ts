import chalk from "chalk";

/**
 * getMathAdvice(meta)
 * Fournit un petit encadré orange clair avec :
 * - un rappel simple du concept mathématique
 * - un exemple basé sur la main précédente
 * - une astuce rapide pour calculer mentalement
 */
export function getMathAdvice(meta: Record<string, any>): string {
  const pot = meta.pot ?? 0;
  const toCall = meta.toCall ?? 0;
  const potOdds = meta.potOdds ?? 0;

  if (!pot || !toCall) return "";

  // 🧮 Calcul simple des pot odds en pourcentage
  const oddsPercent = (potOdds * 100).toFixed(1);
  const requiredEquity = Math.round(potOdds * 100);

  // ✳️ Format visuel lisible
  const header = chalk.bgHex("#FF8C00").black.bold(" 🧮 Conseil mathématique ");
  const border = chalk.hex("#FF8C00")("─────────────────────────────");

  const tip = chalk.yellowBright(
    `💡 Astuce : si tu dois payer ${toCall} pour un pot total de ${pot},\n` +
    `tu dois gagner environ ${requiredEquity}% du temps pour que ce soit rentable (EV positif).\n`
  );

  const examples = chalk.white(
    `👉 Exemple : pot = ${pot}, mise à payer = ${toCall}  →  pot odds ≈ ${oddsPercent}%\n` +
    `Si ta main gagne plus d’une fois sur ${Math.round(100 / requiredEquity)}, tu peux CALL.\n`
  );

  const glossary = chalk.gray(
    `(EV = espérance de gain, Range = ensemble de mains possibles, Fold equity = chance que l’adversaire se couche)`
  );

  return `\n${header}\n${border}\n${tip}${examples}${glossary}\n${border}\n`;
}
