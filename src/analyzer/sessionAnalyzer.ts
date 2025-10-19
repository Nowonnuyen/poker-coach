import fs from 'fs';
import path from 'path';
import chalk from 'chalk';
import { summarizePlayers, PlayerStats } from './playerTracker';

// --- Récupère toutes les stats des joueurs depuis le fichier ---
function getAllPlayerStats(): Record<string, PlayerStats> {
  const statsFile = path.resolve(__dirname, '../../data/playerStats.json');
  if (!fs.existsSync(statsFile)) return {};
  try {
    const raw = fs.readFileSync(statsFile, 'utf-8');
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

// --- Analyse et synthèse de session ---
export function analyzeSession(heroName = 'NonoBasket') {
  const stats = getAllPlayerStats();
  const players = Object.values(stats);

  if (players.length === 0) {
    console.log(chalk.yellow('Aucune donnée de joueur trouvée.'));
    return;
  }

  const heroData: PlayerStats | undefined = stats[heroName];
  const notes: string[] = [];

  console.log(chalk.cyan.bold('\n📊 SYNTHÈSE DE SESSION 📊'));
  console.log('──────────────────────────────────────────────\n');

  console.log(summarizePlayers());
  console.log('\n──────────────────────────────────────────────\n');

  if (!heroData) {
    console.log(chalk.red(`Aucune donnée trouvée pour ${heroName}`));
    return;
  }

  // --- Analyse du style du héros ---
  const vpipRate = heroData.vpip / heroData.handsPlayed * 100;
  const pfrRate = heroData.pfr / heroData.handsPlayed * 100;

  if (vpipRate > 40 && pfrRate < 10)
    notes.push('Tu joues trop loose passif – typiquement le profil d’un calling station.');
  else if (vpipRate < 20 && pfrRate > 18)
    notes.push('Tu joues trop tight agressif – style solide mais parfois prévisible.');
  else if (vpipRate >= 20 && vpipRate <= 35 && pfrRate >= 12 && pfrRate <= 20)
    notes.push('Ton style est équilibré et agressif : bon profil TAG (Tight Aggressive).');
  else
    notes.push('Ton profil semble fluctuant – pense à stabiliser ton plan de jeu.');

  // --- Bilan financier ---
  if (heroData.winnings > 0)
    notes.push(`✅ Tu termines positif (+${heroData.winnings.toFixed(2)}€). Continue à jouer concentré.`);
  else if (heroData.winnings < 0)
    notes.push(`❌ Session négative (${heroData.winnings.toFixed(2)}€). Analyse les spots clés où tu perds le plus.`);
  else
    notes.push(`🟡 Session neutre. Varie peut-être un peu plus tes ranges d’ouverture.`);

  // --- Conclusion ---
  console.log(chalk.bold('\n🧠 Analyse personnelle :\n'));
  for (const n of notes) {
    console.log('• ' + chalk.whiteBright(n));
  }

  console.log(chalk.cyan('\n──────────────────────────────────────────────'));
  console.log(chalk.cyan(`Nombre total de mains analysées : ${heroData.handsPlayed}`));
  console.log(chalk.cyan(`VPIP: ${vpipRate.toFixed(1)}% | PFR: ${pfrRate.toFixed(1)}% | Winnings: ${heroData.winnings.toFixed(2)}€`));
  console.log(chalk.cyan('──────────────────────────────────────────────\n'));
}

// --- Lancement direct depuis la ligne de commande ---
if (require.main === module) {
  analyzeSession();
}
