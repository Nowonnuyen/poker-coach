// src/analyzer/mathTutor.ts
import chalk from "chalk";

/**
 * Génère un petit encadré pédagogique orange après chaque main.
 * Objectif : vulgariser un concept mathématique du poker pour un joueur débutant.
 */
export function getMathTip(handText: string): string {
  // Détecter quelques éléments du contexte de la main
  const isPreflop = /\*\*\* Pre-Flop \*\*\*/i.test(handText);
  const isFlop = /\*\*\* Flop \*\*\*/i.test(handText);
  const isTurn = /\*\*\* Turn \*\*\*/i.test(handText);
  const isRiver = /\*\*\* River \*\*\*/i.test(handText);

  let topic = "";
  let tip = "";
  let shortcut = "";

  if (isPreflop) {
    topic = "Probabilité et Range (ensemble de mains possibles)";
    tip = "Chaque main de départ a une probabilité d’être meilleure qu’une autre. Une paire a environ 50% d’équité contre deux cartes hautes non assorties.";
    shortcut = "Astuce : souviens-toi que AA > 80% contre une main aléatoire.";
  } else if (isFlop) {
    topic = "Équité (EV : valeur espérée)";
    tip = "L’équité correspond à la probabilité de gagner le pot à long terme. Si tu gagnes 40% du temps pour un pot de 1€, ton EV est 0.4€.";
    shortcut = "Astuce : multiplie le nombre d’outs par 4 pour estimer ta chance de toucher d’ici la river (règle du 4).";
  } else if (isTurn) {
    topic = "Cote du pot (pot odds)";
    tip = "Compare la mise à payer à la taille totale du pot. Si tu dois payer 1€ pour espérer gagner 5€, tu dois gagner plus de 1/6 ≈ 17% du temps pour que ce soit rentable.";
    shortcut = "Astuce : si ta chance de toucher > mise/pot total, alors le call est EV+.";
  } else if (isRiver) {
    topic = "Fold equity (chance que l’adversaire se couche)";
    tip = "Même sans la meilleure main, tu peux gagner en misant si ton adversaire abandonne souvent. C’est la fold equity.";
    shortcut = "Astuce : plus le pot est gros, plus une petite mise peut générer beaucoup de fold equity.";
  } else {
    topic = "Rappel général : logique des décisions";
    tip = "Chaque action (check, call, raise, fold) vise à maximiser ton EV (valeur espérée) selon les infos disponibles.";
    shortcut = "Astuce : demande-toi toujours “qu’est-ce qui me rapporte le plus à long terme ?”.";
  }

  const box = `
${chalk.bgHex("#ff9500").black.bold(" 📘 CONSEIL MATHÉMATIQUE ")}
${chalk.hex("#ffb347").bold(topic)}
${tip}
${chalk.gray(shortcut)}
──────────────────────────────────────────────
`;

  return box;
}
