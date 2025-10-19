import fs from 'fs';
import path from 'path';

export interface PlayerStats {
  name: string;
  handsPlayed: number;
  vpip: number;
  pfr: number;
  winnings: number;
  lastSeen?: number;   // dernière activité (ms)
  lastTable?: string;  // 🆕 dernière table vue (ex: "Aalen 03")
}

const statsFile = path.resolve(__dirname, '../../data/playerStats.json');

// --- Charge le fichier JSON des stats (ou initialise) ---
function loadStats(): Record<string, PlayerStats> {
  if (!fs.existsSync(statsFile)) return {};
  try {
    const raw = fs.readFileSync(statsFile, 'utf-8');
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

// --- Sauvegarde ---
function saveStats(stats: Record<string, PlayerStats>) {
  const dir = path.dirname(statsFile);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(statsFile, JSON.stringify(stats, null, 2), 'utf-8');
}

// --- Met à jour les stats à partir d’une main Winamax ---
export function updatePlayerStats(handText: string) {
  const stats = loadStats();

  // 🆕 Extraire le nom de la table (ex: "Aalen 03")
  const tableMatch = handText.match(/Table:\s*'([^']+)'/i);
  const tableName = tableMatch ? tableMatch[1].trim() : undefined;

  // Trouve tous les pseudos de la main
  const playerRegex = /Seat \d+: ([^\(]+) \(/g;
  let match;
  const players: string[] = [];

  while ((match = playerRegex.exec(handText)) !== null) {
    const name = match[1].trim();
    if (!players.includes(name)) players.push(name);
  }

  // Détection simple de participation / agression / gains
  for (const player of players) {
    if (!stats[player]) {
      stats[player] = {
        name: player,
        handsPlayed: 0,
        vpip: 0,
        pfr: 0,
        winnings: 0,
        lastSeen: Date.now(),
        lastTable: tableName, // 🆕 on mémorise la table
      };
    }

    const s = stats[player];
    s.handsPlayed++;
    s.lastSeen = Date.now();
    if (tableName) s.lastTable = tableName; // 🆕 mise à jour de la table courante

    // VPIP : s’il y a "calls" ou "raises"
    if (new RegExp(`${player} (calls|raises)`, 'i').test(handText)) {
      s.vpip++;
    }

    // PFR : s’il y a "raises"
    if (new RegExp(`${player} raises`, 'i').test(handText)) {
      s.pfr++;
    }

    // Winnings
    const winMatch = handText.match(new RegExp(`${player} .* won ([0-9.,]+)`, 'i'));
    if (winMatch) {
      const amount = parseFloat(winMatch[1].replace(',', '.'));
      s.winnings += isNaN(amount) ? 0 : amount;
    }
  }

  saveStats(stats);
}

// --- Obtenir un résumé lisible (toutes tables confondues) ---
export function summarizePlayers(): string {
  const stats = loadStats();
  const players = Object.values(stats);

  if (players.length === 0) return 'Aucun joueur analysé pour le moment.';

  const lines = players.map(p => {
    const vpipPct = ((p.vpip / p.handsPlayed) * 100).toFixed(1);
    const pfrPct = ((p.pfr / p.handsPlayed) * 100).toFixed(1);
    const net = p.winnings.toFixed(2);
    return `${p.name.padEnd(15)} | VPIP: ${vpipPct}% | PFR: ${pfrPct}% | Winnings: ${net}€`;
  });

  return lines.join('\n');
}

// --- Expose toutes les stats (objet) ---
export function getAllPlayerStats(): Record<string, PlayerStats> {
  return loadStats();
}
