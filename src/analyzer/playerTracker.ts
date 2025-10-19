import fs from 'fs';
import path from 'path';

export interface PlayerStats {
  name: string;
  handsPlayed: number;
  vpip: number;
  pfr: number;
  winnings: number;
}

const statsFile = path.resolve(__dirname, '../../data/playerStats.json');

// --- Mémoire persistante (chargée une fois au démarrage) ---
let playerStats: Record<string, PlayerStats> = loadStats();

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

// --- Sauvegarde sur disque ---
function saveStats() {
  const dir = path.dirname(statsFile);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(statsFile, JSON.stringify(playerStats, null, 2), 'utf-8');
}

// --- Met à jour les stats d’un joueur à partir du texte d’une main ---
export function updatePlayerStats(handText: string) {
  // --- Trouve tous les pseudos présents dans la main ---
  const playerRegex = /Seat \d+: ([^\(]+) \(/g;
  let match;
  const players: string[] = [];

  while ((match = playerRegex.exec(handText)) !== null) {
    const name = match[1].trim();
    if (!players.includes(name)) players.push(name);
  }

  // --- Analyse individuelle ---
  for (const player of players) {
    if (!playerStats[player]) {
      playerStats[player] = {
        name: player,
        handsPlayed: 0,
        vpip: 0,
        pfr: 0,
        winnings: 0,
      };
    }

    const s = playerStats[player];
    s.handsPlayed++;

    // VPIP : s’il y a "calls" ou "raises"
    if (new RegExp(`${player} (calls|raises)`, 'i').test(handText)) {
      s.vpip++;
    }

    // PFR : s’il y a "raises"
    if (new RegExp(`${player} raises`, 'i').test(handText)) {
      s.pfr++;
    }

    // Winnings : détecte les gains
    const winMatch = handText.match(new RegExp(`${player} .* (won|remporte) ([0-9.,]+)`, 'i'));
    if (winMatch) {
      const amount = parseFloat(winMatch[2].replace(',', '.'));
      s.winnings += isNaN(amount) ? 0 : amount;
    }
  }

  saveStats();
}

// --- Obtenir un résumé lisible pour affichage console ---
export function summarizePlayers(): string {
  const players = Object.values(playerStats);

  if (players.length === 0) return 'Aucun joueur analysé pour le moment.';

  const lines = players.map(p => {
    const vpipPct = ((p.vpip / p.handsPlayed) * 100).toFixed(1);
    const pfrPct = ((p.pfr / p.handsPlayed) * 100).toFixed(1);
    const net = p.winnings.toFixed(2);
    return `${p.name.padEnd(15)} | VPIP: ${vpipPct}% | PFR: ${pfrPct}% | Winnings: ${net}€`;
  });

  return lines.join('\n');
}

// --- Fournit toutes les stats brutes (utilisé par sessionAnalyzer) ---
export function getAllPlayerStats(): Record<string, PlayerStats> {
  return playerStats;
}
