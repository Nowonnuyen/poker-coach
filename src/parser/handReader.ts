import fs from 'fs';
import path from 'path';
import chokidar from 'chokidar';
import chalk from 'chalk';
import { analyzeHand } from '../analyzer/liveAnalyzer';
import { updatePlayerStats } from '../analyzer/playerTracker';
import { getTableProfileAndAdvice } from '../analyzer/opponentProfiler';

const handsDir = path.resolve(
  '/Users/nowonnguyen/Library/Application Support/winamax/documents/accounts/NonoBasket/history'
);
const fileOffsets: Record<string, number> = {};
let sessionHandCount = 0;

export function splitHands(content: string): string[] {
  return content
    .split(/\r?\n\r?\n/)
    .map(h => h.trim())
    .filter(h => h.length > 0);
}

/* ---------- HOLE CARDS: big illustrated rendering ---------- */

type Suit = 'h' | 'd' | 'c' | 's';

function suitGlyph(s: Suit): { sym: string; colorize: (t: string) => string } {
  switch (s) {
    case 'h': return { sym: '♥', colorize: chalk.redBright };
    case 'd': return { sym: '♦', colorize: chalk.redBright };
    case 'c': return { sym: '♣', colorize: chalk.whiteBright };
    case 's': return { sym: '♠', colorize: chalk.whiteBright };
  }
}

function prettyRank(r: string): string {
  if (r.toUpperCase() === 'T') return '10';
  return r.toUpperCase();
}

function buildCard(rank: string, suit: Suit): string[] {
  const r = prettyRank(rank);
  const { sym, colorize } = suitGlyph(suit);

  // fixed width card; handle 10 which is two chars
  const top = r.padEnd(2, ' ');
  const bot = r.padStart(2, ' ');

  const border = chalk.whiteBright;
  const midSuit = colorize(sym);

  // 11x7 box
  return [
    border('┌─────────┐'),
    border('│ ') + colorize(top[0]) + (top[1] ?? ' ') + border('       │'),
    border('│         │'),
    border('│    ') + midSuit + border('    │'),
    border('│         │'),
    border('│       ') + colorize(bot[0]) + (bot[1] ?? ' ') + border('│'),
    border('└─────────┘'),
  ];
}

function renderTwoCards(rank1: string, suit1: Suit, rank2: string, suit2: Suit): string {
  const c1 = buildCard(rank1, suit1);
  const c2 = buildCard(rank2, suit2);
  const space = '  ';
  const lines = c1.map((_, i) => c1[i] + space + c2[i]);
  return lines.join('\n');
}

function extractHeroHoleCards(hand: string): { r1: string; s1: Suit; r2: string; s2: Suit } | null {
  // Dealt to NonoBasket [Qh 4c] | [Ah Kh] | [Td Ts]
  const m = hand.match(/Dealt to\s+NonoBasket\s+\[([2-9TJQKA]{1,2})([hdcs])\s+([2-9TJQKA]{1,2})([hdcs])\]/i);
  if (!m) return null;
  return {
    r1: m[1],
    s1: m[2].toLowerCase() as Suit,
    r2: m[3],
    s2: m[4].toLowerCase() as Suit,
  };
}

/* ---------- Highlighting with big cards for hero ---------- */

function highlightHandLines(hand: string) {
  // Try to render hero cards as big ascii
  const hero = extractHeroHoleCards(hand);
  let dealtCaption = '';
  let dealtBlock = '';

  if (hero) {
    const { r1, s1, r2, s2 } = hero;
    const g1 = suitGlyph(s1);
    const g2 = suitGlyph(s2);
    dealtCaption = chalk.bgBlack(
      chalk.bold.redBright(
        ` Dealt to NonoBasket [${prettyRank(r1)}${g1.sym} ${prettyRank(r2)}${g2.sym}] `
      )
    );
    dealtBlock = renderTwoCards(r1, s1, r2, s2);

    // Replace the original dealt line with big block + caption
    const dealtLineRegex = /Dealt to\s+NonoBasket\s+\[[^\]]+\]/i;
    if (dealtLineRegex.test(hand)) {
      hand = hand.replace(dealtLineRegex, `${dealtCaption}\n${dealtBlock}`);
    }
  }

  // Color rounds
  const rounds = ['Pre-Flop', 'Flop', 'Turn', 'River', 'Showdown'];
  let result = hand;
  for (const r of rounds) {
    const regex = new RegExp(`\\*\\*\\*\\s*${r}\\s*\\*\\*\\*`, 'gi');
    result = result.replace(regex, chalk.blue.bold(`*** ${r} ***`));
  }

  return result;
}

/* ---------------------------------------------------------- */

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
    stream.on('data', chunk => {
      data += chunk;
    });

    stream.on('end', async () => {
      fileOffsets[filePath] = newSize;
      const hands = splitHands(data);

      for (const hand of hands) {
        sessionHandCount++;
        const startTime = new Date().toLocaleTimeString();

        // 🟨 Ligne de séparation jaune
        console.log(
          chalk.bgYellow.black.bold(
            '════════════════════════════════════════════════════════════════════════'
          )
        );
        console.log(
          chalk.bgYellow.black.bold(
            `🕒 Main ${sessionHandCount} commencée à ${startTime}`
          )
        );
        console.log(
          chalk.bgYellow.black.bold(
            '════════════════════════════════════════════════════════════════════════'
          )
        );

        try {
          // 🔄 Mise à jour des stats
          updatePlayerStats(hand);

          // 🧠 Analyse IA de la main
          const { advice, reason, meta } = await analyzeHand(hand);

          // 💥 Affiche la main avec mise en forme (inclut grandes cartes)
          console.log(highlightHandLines(hand));

          // 💬 Conseil IA
          console.log(
            `➡️  Conseils IA : ${chalk.green.bold(advice)} (${reason})`
          );
          console.log(
            `Pot: ${meta.pot ?? '-'} | Pot odds: ${(
              (meta.potOdds ?? 0) * 100
            ).toFixed(1)}% | Évaluateur: ${
              meta.evaluatorUsed ? 'oui' : 'non'
            }`
          );

          // 🟣 Si victoire
          const winMatch = hand.match(/(NonoBasket.*(won|remporte).*)/i);
          if (winMatch) {
            const winText = winMatch[1].trim();
            const deco = '🏆🎉';
            const lineLength = winText.length + deco.length * 2 + 2;
            console.log(chalk.magenta.bold('\n┌' + '─'.repeat(lineLength) + '┐'));
            console.log(
              chalk.magenta.bold(`│ ${deco} ${winText} ${deco} │`)
            );
            console.log(
              chalk.magenta.bold('└' + '─'.repeat(lineLength) + '┘\n')
            );
          }

          // 🎯 Profil de la table et stratégie actuelle
          const tableInfo = getTableProfileAndAdvice(hand);
          if (tableInfo) console.log(tableInfo);

        } catch (err) {
          console.error('Erreur dans l’analyse de la main :', err);
        }
      }
    });
  }
}

export function watchHandsFolder() {
  console.log(`[Watcher] Surveillance du dossier : ${handsDir}`);

  const watcher = chokidar.watch(handsDir, {
    persistent: true,
    ignoreInitial: false,
    depth: 0
  });

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

if (require.main === module) {
  watchHandsFolder();
}
