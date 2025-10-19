import fs from 'fs';
import path from 'path';
import chalk from 'chalk';
import { PlayerStats } from './playerTracker';

const statsFile = path.resolve(__dirname, '../../data/playerStats.json');
const archiveFile = path.resolve(__dirname, '../../data/playerArchive.json');

// --- Charge les données actuelles ---
function loadStats(): Record<string, PlayerStats> {
  if (!fs.existsSync(statsFile)) return {};
  try {
    return JSON.parse(fs.readFileSync(statsFile, 'utf-8'));
  } catch {
    return {};
  }
}

// --- Sauvegarde (utile si tu veux archiver) ---
function saveStats(stats: Record<string, PlayerStats>) {
  fs.writeFileSync(statsFile, JSON.stringify(stats, null, 2), 'utf-8');
}

// --- Archive les joueurs inactifs ---
export function archiveOldPlayers() {
  const now = Date.now();
  const stats = loadStats();
  const active: Record<string, PlayerStats> = {};
  const archived: Record<string, PlayerStats> = {};

  for (const [name, p] of Object.entries(stats)) {
    const inactiveSince = now - (p.lastSeen ?? now);
    if (inactiveSince < 45 * 60 * 1000) {
      active[name] = p; // actif = joué il y a moins de 45 min
    } else {
      archived[name] = p;
    }
  }

  // Sauvegarde les actifs et archive séparément
  saveStats(active);
  fs.writeFileSync(archiveFile, JSON.stringify(archived, null, 2), 'utf-8');

  return { active, archived };
}

// --- Affiche le résumé clair des joueurs actifs ---
export function displayPlayerSummary() {
  const { active, archived } = archiveOldPlayers();
  const players = Object.values(active);

  if (players.length === 0) {
    console.log(chalk.gray('Aucun joueur actif actuellement à la table.'));
    return;
  }

  console.log(chalk.cyan.bold('\n📊 PROFIL DE LA TABLE :'));
  console.log(chalk.gray('──────────────────────────────────────────────'));

  for (const p of players) {
    const vpip = ((p.vpip / p.handsPlayed) * 100).toFixed(1);
    const pfr = ((p.pfr / p.handsPlayed) * 100).toFixed(1);

    // Déterminer le style du joueur selon VPIP/PFR
    let style = '';
    if (p.vpip > 45 && p.pfr < 10) style = '🎣 CALLING STATION';
    else if (p.vpip > 40 && p.pfr > 25) style = '🔥 LAG';
    else if (p.vpip < 15 && p.pfr < 10) style = '🧊 NIT';
    else style = '😐 REG';

    console.log(
      `${style} ${p.name.padEnd(15)} | VPIP: ${vpip} | PFR: ${pfr} | ${style.replace(/.* /, '')} | ${p.winnings.toFixed(2)}€`
    );
  }

  console.log(chalk.gray('──────────────────────────────────────────────'));

  // 🗃️ Si des joueurs ont été archivés, afficher un court résumé
  if (Object.keys(archived).length > 0) {
    console.log(
      chalk.dim(
        `(${Object.keys(archived).length} joueurs inactifs archivés — réapparaîtront s’ils rejouent)`
      )
    );
  }
}

// --- Sauvegarde finale (appelée à la fin de session) ---
export function savePlayerSummaryToFile() {
  const { active } = archiveOldPlayers();
  const reportFile = path.resolve(__dirname, '../../data/session_report.txt');

  const lines = Object.values(active).map(p => {
    const vpip = ((p.vpip / p.handsPlayed) * 100).toFixed(1);
    const pfr = ((p.pfr / p.handsPlayed) * 100).toFixed(1);
    return `${p.name} | VPIP: ${vpip}% | PFR: ${pfr}% | Winnings: ${p.winnings.toFixed(2)}€`;
  });

  fs.writeFileSync(reportFile, lines.join('\n'), 'utf-8');
  console.log(chalk.yellow(`\n🗃️ Rapport sauvegardé dans ${reportFile}`));
}
