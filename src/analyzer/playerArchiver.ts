import fs from 'fs';
import path from 'path';
import { PlayerStats } from './playerTracker';

const archiveFile = path.resolve(__dirname, '../../data/archivedPlayers.json');
const MAX_ARCHIVE = 1000;

/** Fusionne deux profils du même joueur (moyennes pondérées + cumuls). */
function mergePlayerStats(old: PlayerStats, fresh: PlayerStats): PlayerStats {
  const totalHands = old.handsPlayed + fresh.handsPlayed;
  return {
    ...old,
    handsPlayed: totalHands,
    vpip: ((old.vpip * old.handsPlayed + fresh.vpip * fresh.handsPlayed) / totalHands),
    pfr: ((old.pfr * old.handsPlayed + fresh.pfr * fresh.handsPlayed) / totalHands),
    winnings: old.winnings + fresh.winnings,
    lastSeen: Math.max(old.lastSeen ?? 0, fresh.lastSeen ?? 0),
  };
}

/** Archive une liste de joueurs (inactifs), avec fusion et limite de taille. */
export function archiveOldPlayers(oldPlayers: PlayerStats[]) {
  if (oldPlayers.length === 0) return;

  // Charger l’archive existante
  let archive: PlayerStats[] = [];
  if (fs.existsSync(archiveFile)) {
    try {
      archive = JSON.parse(fs.readFileSync(archiveFile, 'utf-8'));
    } catch {
      archive = [];
    }
  }

  // Fusionner par nom
  for (const p of oldPlayers) {
    const existing = archive.find(a => a.name === p.name);
    if (existing) {
      Object.assign(existing, mergePlayerStats(existing, p));
    } else {
      archive.unshift(p); // nouveaux en tête
    }
  }

  // Limiter la taille
  if (archive.length > MAX_ARCHIVE) {
    archive = archive.slice(0, MAX_ARCHIVE);
  }

  // Sauvegarder
  const dir = path.dirname(archiveFile);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(archiveFile, JSON.stringify(archive, null, 2), 'utf-8');

  console.log(`📦 ${oldPlayers.length} joueurs archivés (total: ${archive.length})`);
}
