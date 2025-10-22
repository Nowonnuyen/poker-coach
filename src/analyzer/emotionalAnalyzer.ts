// src/analyzer/emotionalAnalyzer.ts
import chalk from "chalk";

/**
 * Analyse émotionnelle et détection du tilt.
 * Évalue les joueurs sur les dernières mains observées
 * selon leur agressivité, fréquence de bet, et résultat.
 */

interface PlayerEmotion {
  name: string;
  tiltLevel: number; // 0 → calme / 1 → tilt complet
  mood: "calme" | "agressif" | "en tilt" | "fatigué" | "focus";
  trend?: string;
}

export function analyzeEmotions(allHands: string[]): string {
  if (!allHands || allHands.length === 0) {
    return chalk.yellow("⚠️  Aucune main récente à analyser émotionnellement.");
  }

  const stats: Record<string, PlayerEmotion> = {};

  // Analyser les 15 dernières mains
  for (const hand of allHands.slice(-15)) {
    const lines = hand.split("\n");

    for (const line of lines) {
      const action = line.match(/^([A-Za-z0-9_]+): (bets|raises|folds|calls|checks|shows)/i);
      if (!action) continue;

      const name = action[1];
      const verb = action[2].toLowerCase();
      if (!stats[name]) stats[name] = { name, tiltLevel: 0.5, mood: "focus" };

      const p = stats[name];

      if (verb === "raises") p.tiltLevel += 0.1;
      if (verb === "bets") p.tiltLevel += 0.05;
      if (verb === "folds") p.tiltLevel -= 0.05;
      if (/all-in/i.test(line)) p.tiltLevel += 0.25;
      if (/lost|perd/i.test(line)) p.tiltLevel += 0.1;
      if (/won|remporte/i.test(line)) p.tiltLevel -= 0.1;

      p.tiltLevel = Math.max(0, Math.min(1, p.tiltLevel));

      if (p.tiltLevel > 0.8) p.mood = "en tilt";
      else if (p.tiltLevel > 0.6) p.mood = "agressif";
      else if (p.tiltLevel < 0.3) p.mood = "calme";
      else p.mood = "focus";
    }
  }

  const players = Object.values(stats).sort((a, b) => b.tiltLevel - a.tiltLevel);

  if (players.length === 0) return chalk.gray("Table neutre : aucune émotion marquée.");

  let result = chalk.hex("#FFA500").bold("\n🧠 ANALYSE ÉMOTIONNELLE EN TEMPS RÉEL :\n");
  result += chalk.hex("#FFA500")("──────────────────────────────────────────────\n");

  for (const p of players) {
    const tilt = Math.round(p.tiltLevel * 100);

    if (p.mood === "en tilt") {
      result += chalk.redBright(
        `🔥 ${p.name} est clairement en tilt (${tilt}%) — pertes récentes ou décisions impulsives.\n`
      );
      result += chalk.hex("#FFA500")("💡 Exploite-le : élargis ta range et valorise tes mains fortes.\n\n");
    } else if (p.mood === "agressif") {
      result += chalk.yellowBright(
        `⚠️ ${p.name} devient agressif (${tilt}%) — il tente de se refaire.\n`
      );
      result += chalk.hex("#FFA500")("🎯 Contre-stratégie : piège-le avec des check-raises.\n\n");
    } else if (p.mood === "calme") {
      result += chalk.greenBright(`🧘 ${p.name} reste calme et stable (${tilt}%).\n\n`);
    } else {
      result += chalk.cyan(`${p.name} garde son sang-froid (${tilt}%).\n\n`);
    }
  }

  result += chalk.hex("#FFA500")("──────────────────────────────────────────────\n");
  return result;
}
