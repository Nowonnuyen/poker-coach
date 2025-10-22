// src/analyzer/emotionalAnalyzer.ts
import chalk from "chalk";

/**
 * Analyse émotionnelle des joueurs à la table.
 * Détecte les signes de tilt, frustration ou euphorie à partir des logs récents.
 * Retourne un résumé textuel simple et pédagogique.
 */

interface PlayerEmotion {
  name: string;
  tiltLevel: number; // 0 à 1
  mood: "calme" | "neutre" | "agressif" | "en tilt" | "fatigué";
  reason?: string;
}

/**
 * Analyse les mains de la session pour détecter les comportements à risque.
 */
export function analyzeEmotions(allHands: string[]): string {
  if (!allHands || allHands.length === 0) {
    return chalk.yellow("Aucune main à analyser pour le moment.");
  }

  const playerStats: Record<string, PlayerEmotion> = {};

  for (const hand of allHands.slice(-15)) {
    const lines = hand.split("\n");

    for (const line of lines) {
      const m = line.match(/^([A-Za-z0-9_]+): (bets|raises|folds|calls|checks|shows)/i);
      if (m) {
        const name = m[1];
        if (!playerStats[name]) {
          playerStats[name] = { name, tiltLevel: 0, mood: "neutre" };
        }

        const p = playerStats[name];

        if (/raises/i.test(line)) p.tiltLevel += 0.1;
        if (/bets/i.test(line)) p.tiltLevel += 0.05;
        if (/folds/i.test(line)) p.tiltLevel -= 0.05;
        if (/shows/i.test(line) && /loses/i.test(line)) p.tiltLevel += 0.15;
        if (/all-in/i.test(line)) p.tiltLevel += 0.2;

        // clamp tilt
        p.tiltLevel = Math.max(0, Math.min(1, p.tiltLevel));

        if (p.tiltLevel > 0.7) p.mood = "en tilt";
        else if (p.tiltLevel > 0.5) p.mood = "agressif";
        else if (p.tiltLevel < 0.3) p.mood = "calme";
      }
    }
  }

  const sorted = Object.values(playerStats).sort((a, b) => b.tiltLevel - a.tiltLevel);

  if (sorted.length === 0) {
    return chalk.green("Table équilibrée : aucune émotion extrême détectée.");
  }

  let result = "";

  for (const p of sorted) {
    if (p.tiltLevel > 0.75) {
      result += chalk.redBright(
        `🔥 ${p.name} est probablement en tilt ! (${Math.round(
          p.tiltLevel * 100
        )}%) — il mise trop souvent ou fait des all-ins douteux.\n`
      );
      result += chalk.red(
        "👉 Profite-en : laisse-le bluffer et attrape-le avec une main solide.\n\n"
      );
    } else if (p.tiltLevel > 0.5) {
      result += chalk.yellow(
        `⚠️ ${p.name} montre de l’agressivité croissante (${Math.round(
          p.tiltLevel * 100
        )}%). Surveille un possible basculement en tilt.\n\n`
      );
    } else {
      result += chalk.green(
        `🧘 ${p.name} reste calme et joue de manière posée (${Math.round(
          p.tiltLevel * 100
        )}%).\n\n`
      );
    }
  }

  return result.trim();
}
