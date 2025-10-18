import fs from 'fs';
import path from 'path';
import chalk from 'chalk';
import { summarizePlayers } from './playerTracker';

export function displayPlayerSummary(): void {
  const summary = summarizePlayers();
  const lines = summary.split('\n');

  console.log(chalk.gray('\n📊 Résumé des joueurs analysés :'));
  console.log(chalk.gray('──────────────────────────────────────────────'));

  for (const line of lines) {
    if (line.startsWith('Aucun joueur')) {
      console.log(chalk.yellow(line));
      continue;
    }

    const match = line.match(/(.+)\| VPIP: ([\d.]+)% \| PFR: ([\d.]+)% \| Winnings: ([\d.-]+)€/);
    if (match) {
      const [, name, vpipStr, pfrStr, winningsStr] = match;
      const vpip = parseFloat(vpipStr);
      const pfr = parseFloat(pfrStr);
      const winnings = parseFloat(winningsStr);

      let color = chalk.white;
      let tag = '';

      if (vpip > 45 && pfr < 10) {
        color = chalk.bgBlue.white.bold;
        tag = '🎣 FISH';
      } else if (vpip < 25 && pfr > 18) {
        color = chalk.bgRed.white.bold;
        tag = '🦈 SHARK';
      } else {
        color = chalk.bgGray.black.bold;
        tag = '😐 REG';
      }

      const lineFormatted = `${name.trim().padEnd(15)} | VPIP: ${vpip.toFixed(1)}% | PFR: ${pfr.toFixed(1)}% | Winnings: ${winnings.toFixed(2)}€ | ${tag}`;
      console.log(color(lineFormatted));
    } else {
      console.log(chalk.gray(line));
    }
  }

  console.log(chalk.gray('──────────────────────────────────────────────\n'));
}

// 🔹 Sauvegarde du résumé dans un fichier session_report.txt
export function savePlayerSummaryToFile(): void {
  const summary = summarizePlayers();
  const timestamp = new Date().toLocaleString().replace(/[/:]/g, '-').replace(', ', '_');
  const reportDir = path.resolve(__dirname, '../../reports');
  const reportFile = path.join(reportDir, `session_report_${timestamp}.txt`);

  if (!fs.existsSync(reportDir)) fs.mkdirSync(reportDir, { recursive: true });

  const header = `🎯 Rapport de session – ${new Date().toLocaleString()}\n`;
  const content = header + '\n' + summary + '\n';

  fs.writeFileSync(reportFile, content, 'utf-8');
  console.log(chalk.green.bold(`\n💾 Rapport de session sauvegardé : ${reportFile}\n`));
}
