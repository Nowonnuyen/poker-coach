import chalk from 'chalk';
import { getAllPlayerStats, PlayerStats } from './playerTracker';

export interface OpponentProfile {
  name: string;
  vpip: number;
  pfr: number;
  winnings: number;
  type: string;
  emoji: string;
}

export interface TableProfile {
  players: OpponentProfile[];
  tableMood: string;
  avgVPIP: number;
  avgPFR: number;
}

/** Classe un joueur selon ses stats. */
function classifyPlayer(p: PlayerStats): OpponentProfile {
  const vpip = (p.vpip / (p.handsPlayed || 1)) * 100;
  const pfr = (p.pfr / (p.handsPlayed || 1)) * 100;
  const win = p.winnings;

  let type = 'REG';
  let emoji = '😐';

  if (vpip < 15 && pfr < 10) { type = 'NIT'; emoji = '🧊'; }
  else if (vpip > 15 && vpip <= 25 && pfr >= 12 && pfr <= 20) { type = 'TAG'; emoji = '🎯'; }
  else if (vpip > 30 && pfr > 20) { type = 'LAG'; emoji = '🔥'; }
  else if (vpip > 40 && pfr < 10) { type = 'CALLING STATION'; emoji = '💤'; }
  else if (vpip > 50 && pfr < 5)  { type = 'FISH'; emoji = '🎣'; }

  if (win > 10) emoji += '💰';
  if (win < -5) emoji += '🥶';

  return { name: p.name, vpip, pfr, winnings: win, type, emoji };
}

/** Vue d’ensemble de la table. */
export function analyzeOpponents(): TableProfile {
  const stats = getAllPlayerStats(); // Record<string, PlayerStats>
  // ✅ Cast explicite pour éviter unknown[]
  const players = Object.values(stats) as PlayerStats[];

  if (players.length === 0) {
    console.log(chalk.gray('Aucun joueur à profiler.'));
    return { players: [], tableMood: 'inconnue', avgVPIP: 0, avgPFR: 0 };
  }

  const profiles = players.map((p) => classifyPlayer(p));

  const avgVPIP =
    profiles.reduce((sum, p) => sum + p.vpip, 0) / profiles.length;
  const avgPFR =
    profiles.reduce((sum, p) => sum + p.pfr, 0) / profiles.length;

  let tableMood = 'équilibrée';
  if (avgVPIP > 35) tableMood = 'très loose 🌀';
  else if (avgVPIP < 20) tableMood = 'serrée 🧱';
  else if (avgPFR > 25) tableMood = 'agressive ⚡';

  console.log(chalk.bold('\n🎯 PROFIL DE LA TABLE :'));
  console.log(chalk.gray('──────────────────────────────────────────────'));

  for (const p of profiles) {
    let color = chalk.white;
    if (p.type === 'NIT') color = chalk.cyan;
    else if (p.type === 'TAG') color = chalk.green;
    else if (p.type === 'LAG') color = chalk.red;
    else if (p.type === 'CALLING STATION') color = chalk.yellow;
    else if (p.type === 'FISH') color = chalk.magenta;

    console.log(
      color(
        `${p.emoji} ${p.name.padEnd(15)} | VPIP: ${p.vpip.toFixed(1)} | PFR: ${p.pfr.toFixed(1)} | ${p.type} | ${p.winnings.toFixed(2)}€`
      )
    );
  }

  console.log(chalk.gray('──────────────────────────────────────────────'));
  console.log(
    chalk.bold(
      `💡 Table moyenne : VPIP ${avgVPIP.toFixed(1)} / PFR ${avgPFR.toFixed(1)} → ${tableMood}`
    )
  );

  return { players: profiles, tableMood, avgVPIP, avgPFR };
}

// Exécution directe pour test
if (require.main === module) {
  analyzeOpponents();
}
