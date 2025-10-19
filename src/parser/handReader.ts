import fs from 'fs';
import path from 'path';
import chokidar from 'chokidar';
import chalk from 'chalk';
import { analyzeHand } from '../analyzer/liveAnalyzer';
import { updatePlayerStats } from '../analyzer/playerTracker';
import { displayPlayerSummary, savePlayerSummaryToFile } from '../analyzer/playerDisplay';
import { analyzeSession } from '../analyzer/sessionAnalyzer'; // 🔹 nouveau

const handsDir = path.resolve('/Users/nowonnguyen/Library/Application Support/winamax/documents/accounts/NonoBasket/history');
const fileOffsets: Record<string, number> = {};
let sessionHandCount = 0;

// --- découpe le texte en mains individuelles ---
export function splitHands(content: string): string[] {
  return content
    .split(/\r?\n\r?\n/)
    .map(h => h.trim())
    .filter(h => h.length > 0);
}

// --- mise en couleur des lignes importantes ---
function highlightHandLines(hand: string) {
  // 💥 Ta main en rouge gras
  const handHighlighted = hand.replace(
    /(Dealt to NonoBasket \[.*?\])/i,
    (_, match) => chalk.red.bold.bgBlack(` ${match} `)
  );

  // 🔹 Les tours du jeu en bleu
  const rounds = ['Pre-flop', 'Flop', 'Turn', 'River', 'Showdown'];
  let result = handHighlighted;
  for (const r of rounds) {
    const regex = new RegExp(r, 'gi');
    result = result.replace(regex, chalk.blue.bold(r));
  }

  return result;
}

// --- lecture incrémentale des nouvelles données ---
export async function readNewData(filePath: string) {
  const previousSize = fileOffsets[filePath] || 0;
  const stats = fs.statSync(filePath);
  const newSize = stats.size;

  if (newSize > previousSize) {
    const stream = fs.createReadStream(filePath, {
      start: previousSize,
      end: newSize,
      encoding: 'utf-8'
    });

    let data = '';
    stream.on('data', chunk => { data += chunk; });

    stream.on('end', async () => {
      fileOffsets[filePath] = newSize;
      const hands = splitHands(data);

      for (const hand of hands) {
        sessionHandCount++;
        const startTime = new Date().toLocaleTimeString();

        // 🟨 Ligne de séparation jaune
        console.log(chalk.bgYellow.black.bold('════════════════════════════════════════════════════════════════════════'));
        console.log(chalk.bgYellow.black.bold(`🕒 Main ${sessionHandCount} commencée à ${startTime}`));
        console.log(chalk.bgYellow.black.bold('════════════════════════════════════════════════════════════════════════'));

        try {
          updatePlayerStats(hand);

          const { advice, reason, meta } = await analyzeHand(hand);

          // 💥 Affichage main avec surlignage des cartes et des tours
          console.log(highlightHandLines(hand));

          // ➡️ Conseils IA
          console.log(`➡️  Conseils IA : ${chalk.green.bold(advice)} (${reason})`);
          console.log(`Pot: ${meta.pot ?? '-'} | Pot odds: ${(meta.potOdds ?? 0 * 100).toFixed(1)}% | Évaluateur: ${meta.evaluatorUsed ? 'oui' : 'non'}`);

          // 🟣 Si victoire → encadré violet
          const winMatch = hand.match(/(NonoBasket.*(won|remporte).*)/i);
          if (winMatch) {
            const winText = winMatch[1].trim();
            const deco = '🏆🎉';
            const lineLength = winText.length + deco.length * 2 + 2;
            console.log(chalk.magenta.bold('\n┌' + '─'.repeat(lineLength) + '┐'));
            console.log(chalk.magenta.bold(`│ ${deco} ${winText} ${deco} │`));
            console.log(chalk.magenta.bold('└' + '─'.repeat(lineLength) + '┘\n'));
          }

          // ✅ Affiche le résumé des joueurs après mise à jour
          displayPlayerSummary();

        } catch (err) {
          console.error('Erreur dans l’analyse de la main :', err);
        }
      }
    });
  }
}

// --- surveillance du dossier ---
export function watchHandsFolder() {
  console.log(`[Watcher] Surveillance du dossier : ${handsDir}`);

  const watcher = chokidar.watch(handsDir, { persistent: true, ignoreInitial: false, depth: 0 });

  watcher
    .on('add', filePath => {
      if (!filePath.endsWith('.txt') || filePath.includes('_summary')) return;
      console.log(`[Watcher] Nouveau fichier détecté : ${path.basename(filePath)}`);
      fileOffsets[filePath] = 0;
    })
    .on('change', filePath => {
      if (!filePath.endsWith('.txt') || filePath.includes('_summary')) return;
      readNewData(filePath);
    });

  watcher.on('error', err => console.error('Erreur watcher :', err));
}

// --- Exécution directe ---
if (require.main === module) {
  watchHandsFolder();

  // 🔹 Sauvegarde automatique + analyse stratégique à la fin
  process.on('SIGINT', () => {
    console.log(chalk.yellow('\n🛑 Session terminée. Sauvegarde du rapport...'));

    const report = analyzeSession(); // 🔥 nouveau rapport stratégique
    console.log(report);

    savePlayerSummaryToFile();
    process.exit();
  });
}
