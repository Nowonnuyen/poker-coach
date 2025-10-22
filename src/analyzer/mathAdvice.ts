import chalk from "chalk";

/**
 * Donne un conseil mathématique simple et visuel.
 * Format "cours de lycée" : rappel, exemple, erreur commune, astuce de calcul mental.
 */
export function getMathAdvice(handText: string, meta: Record<string, any>): string {
  const pot = meta.pot ?? 0;
  const toCall = meta.toCall ?? 0;
  const potOdds = meta.potOdds ?? 0;

  // Rappel simple
  const header = chalk.keyword("orange").bold("\n📘 Petit rappel mathématique :");
  const reminder =
    chalk.keyword("orange")(
      `\n👉 La cote du pot (ou "pot odds") te dit si le call est rentable à long terme.\n` +
      `Formule :  toCall / (pot + toCall)\n` +
      `Ici :  ${toCall} / (${pot} + ${toCall}) = ${(potOdds * 100).toFixed(1)}%\n`
    );

  // Exemple étape par étape
  const example =
    chalk.keyword("orange")(
      `\n📗 Exemple de calcul :\n` +
      `Si tu dois payer 20 jetons dans un pot de 80 :\n` +
      `Pot odds = 20 / (80 + 20) = 0,20 = 20%\n` +
      `➡️ Cela veut dire que tu dois gagner au moins 1 coup sur 5 pour que ce call soit "EV+" (espérance positive).`
    );

  // Explication des concepts
  const concept =
    chalk.keyword("orange")(
      `\n📙 Définitions utiles :\n` +
      `- EV (Expected Value) : gain moyen attendu à long terme.\n` +
      `- Range : ensemble de mains possibles de ton adversaire.\n` +
      `- Fold Equity : chance que ton adversaire se couche après ton bet.`
    );

  // Exemple d’erreur typique
  const error =
    chalk.keyword("orange")(
      `\n⚠️ Erreur fréquente :\n` +
      `Beaucoup de joueurs paient sans comparer leurs pot odds à leur probabilité réelle de gagner.\n` +
      `Ex : Tu as 4 cartes de la même couleur → ~9 outs → environ 18% de chance de compléter.\n` +
      `Si tes pot odds sont 25%, le call est mathématiquement perdant (EV–).`
    );

  // Astuce mentale simple
  const tip =
    chalk.keyword("orange")(
      `\n💡 Astuce de calcul mental :\n` +
      `- Multiplie tes "outs" par 2 au flop et par 4 au turn pour estimer ton % de chance.\n` +
      `- Compare ce % avec tes pot odds (si chance > pot odds → call rentable).`
    );

  return `${header}${reminder}${example}${concept}${error}${tip}\n`;
}
