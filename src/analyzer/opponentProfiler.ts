import chalk from "chalk";
import { getAllPlayerStats, PlayerStats } from "./playerTracker";

interface OpponentProfile {
  name: string;
  vpip: number;
  pfr: number;
  winnings: number;
  type: string;
  emoji: string;
}

/**
 * Classe un joueur selon ses stats (VPIP/PFR)
 */
function classifyPlayer(p: PlayerStats): OpponentProfile {
  const vpip = (p.vpip / p.handsPlayed) * 100;
  const pfr = (p.pfr / p.handsPlayed) * 100;

  let type = "REG";
  let emoji = "😐";

  if (vpip >= 50 && pfr <= 15) {
    type = "FISH";
    emoji = "🎣";
  } else if (vpip >= 40 && pfr >= 25) {
    type = "LAG";
    emoji = "🔥";
  } else if (vpip <= 20 && pfr <= 10) {
    type = "NIT";
    emoji = "🧊";
  }

  return { name: p.name, vpip, pfr, winnings: p.winnings, type, emoji };
}

/**
 * Récupère les pseudos de la main en cours (même si Seat X: absent)
 */
function extractPlayersFromHand(hand: string): string[] {
  const players = new Set<string>();

  // 1️⃣ Cherche les lignes Seat X:
  const seatMatches = [...hand.matchAll(/Seat \d+: ([^\(]+)/g)].map((m) =>
    m[1].trim()
  );

  // 2️⃣ Cherche les noms dans les actions (calls, raises, bets, folds, checks)
  const actionMatches = [
    ...hand.matchAll(
      /^([A-Za-z0-9_\-\s]+)\s+(calls|raises|bets|folds|checks)/gim
    ),
  ].map((m) => m[1].trim());

  for (const name of [...seatMatches, ...actionMatches]) {
    if (name && name.length > 1) players.add(name);
  }

  return Array.from(players);
}

/**
 * Construit un profil de table à partir des joueurs détectés dans la main
 */
export function getTableProfileAndAdvice(handText: string): string {
  const allStats = getAllPlayerStats();
  const playersInHand = extractPlayersFromHand(handText);

  if (playersInHand.length === 0) {
    return chalk.gray("📭 Aucun joueur détecté dans cette main.");
  }

  const tablePlayers = Object.values(allStats).filter((p) =>
    playersInHand.includes(p.name)
  );

  // ✅ Si aucun profil trouvé, afficher un message plus clair
  if (tablePlayers.length === 0) {
    const tableMatch = handText.match(/Table:\s*'([^']+)'/);
    const tableName = tableMatch ? tableMatch[1] : "Inconnue";
    return chalk.gray(
      `📭 Aucun profil fiable encore pour la table "${tableName}".`
    );
  }

  const profiles: OpponentProfile[] = tablePlayers.map(classifyPlayer);

  // 🔢 Moyennes de la table
  const avgVPIP =
    profiles.reduce((sum, p) => sum + p.vpip, 0) / profiles.length;
  const avgPFR =
    profiles.reduce((sum, p) => sum + p.pfr, 0) / profiles.length;

  let tableType = "équilibrée";
  let advice =
    "⚖️ Table équilibrée : joue ton A-game standard, reste patient et observateur.";

  if (avgVPIP > 45) {
    tableType = "très loose";
    advice = "💰 Table loose : joue solide, value fort tes bonnes mains.";
  } else if (avgVPIP < 20) {
    tableType = "serrée";
    advice =
      "🧊 Table tight : tente quelques vols de blinds et 3-bets bien ciblés.";
  } else if (avgPFR > 25) {
    tableType = "agressive";
    advice =
      "🤖 Table de regs : mixe value et bluffs construits, évite les lines trop standards.";
  }

  const tableMatch = handText.match(/Table:\s*'([^']+)'/);
  const tableName = tableMatch ? tableMatch[1] : "Inconnue";

  const profileLines = profiles
    .map(
      (p) =>
        `${p.emoji} ${p.name.padEnd(15)} | VPIP: ${p.vpip.toFixed(
          1
        )} | PFR: ${p.pfr.toFixed(1)} | ${p.type.padEnd(15)} | ${p.winnings.toFixed(
          2
        )}€`
    )
    .join("\n");

  return `
🎯 PROFIL DE TABLE EN TEMPS RÉEL :
──────────────────────────────────────────────
${profileLines}
──────────────────────────────────────────────
💡 Table "${tableName}" : VPIP ${avgVPIP.toFixed(1)} / PFR ${avgPFR.toFixed(
    1
  )} → ${tableType}

💡 STRATÉGIE ACTUELLE :
${advice}
──────────────────────────────────────────────
`;
}

/** ✅ Export par défaut pour corriger ton import */
export default getTableProfileAndAdvice;
