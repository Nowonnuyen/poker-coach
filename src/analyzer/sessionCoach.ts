// src/analyzer/sessionCoach.ts
import chalk from "chalk";
import { getAllPlayerStats, PlayerStats } from "./playerTracker";

function labelFromVpipPfr(vpip: number, pfr: number): string {
  if (vpip >= 50 && pfr <= 15) return "Trop loose/passif — calling station";
  if (vpip >= 40 && pfr >= 25) return "Très agressif — LAG";
  if (vpip <= 20 && pfr <= 10) return "Très tight — NIT";
  return "Assez équilibré — REG";
}

export function generateSessionAdvice(heroName = "NonoBasket"): string {
  const orange = (s: string) => chalk.hex("#FFA500")(s);
  const title = chalk.bgHex("#FFA500").black.bold(" 📚 BILAN DE SESSION (Maths + Stratégie) ");
  const sep = chalk.hex("#FFA500")("────────────────────────────────────────────────────────");

  const all = getAllPlayerStats();
  const me: PlayerStats | undefined = all[heroName];

  if (!me || me.handsPlayed === 0) {
    return `\n${title}\n${sep}\n${orange(
      "Pas assez de données sur la session pour toi. Joue encore quelques mains pour un bilan exploitable."
    )}\n${sep}\n`;
  }

  const myVPIP = (me.vpip / me.handsPlayed) * 100;
  const myPFR = (me.pfr / me.handsPlayed) * 100;
  const label = labelFromVpipPfr(myVPIP, myPFR);

  const lines: string[] = [];
  lines.push(`${orange("Mains jouées :")} ${me.handsPlayed}`);
  lines.push(`${orange("VPIP / PFR :")} ${myVPIP.toFixed(1)}% / ${myPFR.toFixed(1)}% (${label})`);
  lines.push(`${orange("Résultat net :")} ${me.winnings.toFixed(2)}€`);

  // Axes de travail (simples et actionnables)
  const workOn: string[] = [];
  if (myVPIP > 35 && myPFR < 15) {
    workOn.push("Resserre tes ranges d’open ; évite de limp/call hors position.");
    workOn.push("Travaille les cotes du pot : ne paye pas par “curiosité”.");
  } else if (myVPIP < 18 && myPFR < 10) {
    workOn.push("Ouvre un peu plus en position pour voler les blinds.");
    workOn.push("Ajoute quelques 3-bets de value/bluff contre des opens larges.");
  } else if (myPFR >> myVPIP) {
    workOn.push("Trop d’agression préflop par rapport aux mains jouées : vérifie la value.");
  } else {
    workOn.push("Globalement OK — revois surtout les calls limites (pot odds).");
  }

  // Alerte math “flagrante” (pédago)
  const mathTip =
    "Vérifie systématiquement : toCall / (pot + toCall). Si ce % > ton % de victoire réaliste, FOLD. Utilise la règle du 2 et 4 pour estimer vite.";

  return `\n${title}\n${sep}\n${lines.map(orange).join("\n")}\n\n${orange("❗ Erreur fréquente :")}\n${orange(
    mathTip
  )}\n\n${orange("🎯 Axes à travailler :")}\n${workOn.map((w) => "• " + w).map(orange).join("\n")}\n${sep}\n`;
}
