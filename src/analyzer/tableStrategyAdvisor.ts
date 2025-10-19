import { OpponentProfile } from './opponentProfiler';
import chalk from 'chalk';

export function analyzeTableStrategy(profiles: OpponentProfile[]) {
  if (!profiles || profiles.length === 0) {
    console.log(chalk.gray('Aucune donnée de table disponible.'));
    return;
  }

  const avgVPIP = profiles.reduce((sum, p) => sum + p.vpip, 0) / profiles.length;
  const avgPFR = profiles.reduce((sum, p) => sum + p.pfr, 0) / profiles.length;

  const lagCount = profiles.filter(p => p.style === 'LAG').length;
  const nitCount = profiles.filter(p => p.style === 'NIT').length;
  const fishCount = profiles.filter(p => p.style === 'CALLING STATION').length;
  const regCount = profiles.filter(p => p.style === 'REG').length;

  console.log(chalk.cyan.bold('\n🎯 STRATÉGIE CONSEILLÉE :'));
  console.log(chalk.gray('──────────────────────────────────────────────'));

  // 🧠 Règles principales selon le type de table
  if (fishCount >= 2 && avgVPIP > 40 && avgPFR < 15) {
    console.log(chalk.green('💧 Table loose passive : joue serré, value-bet fort, évite les bluffs.'));
  } 
  else if (lagCount >= 2 && avgVPIP > 30 && avgPFR > 20) {
    console.log(chalk.red('⚔️  Table agressive : resserre ton range, piège les LAG avec des slowplays.'));
  }
  else if (nitCount >= 3 && avgVPIP < 20 && avgPFR < 10) {
    console.log(chalk.yellow('🧊 Table très serrée : ouvre plus de mains en late position, vole les blinds.'));
  }
  else if (regCount >= profiles.length * 0.7) {
    console.log(chalk.magenta('🤖 Table de regs : varie ton jeu, mixe value et bluffs bien construits.'));
  } 
  else {
    console.log(chalk.blue('⚖️ Table équilibrée : joue ton A-game standard, reste patient et observateur.'));
  }

  console.log(chalk.gray('──────────────────────────────────────────────'));
  console.log(chalk.white(`VPIP moyen: ${avgVPIP.toFixed(1)} | PFR moyen: ${avgPFR.toFixed(1)}`));
}
