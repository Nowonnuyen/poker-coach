import fs from 'fs';
import path from 'path';
import chokidar from 'chokidar';

// ⚙️ Chemin vers le dossier history sur Mac
const handsDir = path.resolve('/Users/nowonnguyen/Library/Application Support/winamax/documents/accounts/NonoBasket/history');

const fileOffsets: Record<string, number> = {}; // garde la taille lue de chaque fichier

// --- découpe le texte en mains individuelles ---
export function splitHands(content: string): string[] {
  return content
    .split(/\r?\n\r?\n/) // double saut de ligne
    .map(h => h.trim())
    .filter(h => h.length > 0);
}

// --- lit seulement les nouvelles lignes d’un fichier ---
export function readNewData(filePath: string) {
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

    stream.on('end', () => {
      fileOffsets[filePath] = newSize;
      const hands = splitHands(data);
      if (hands.length > 0) {
        console.log(`\n[Watcher] Nouvelle main détectée dans "${path.basename(filePath)}"`);
        hands.forEach((h, i) => {
          console.log(`--- Main ${i + 1} ---\n${h}\n----------------`);
        });
      }
    });
  }
}

// --- surveille le dossier ---
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

// --- Exécution uniquement si lancé directement ---
if (require.main === module) {
  watchHandsFolder();
}
