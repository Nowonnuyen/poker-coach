// src/analyzer/liveAnalyzer.ts
import path from 'path';

/**
 * analyzeHand(content)
 * - content: texte brut d'une main (Winamax)
 * - retourne un objet {advice, reason, meta}
 *
 * Le code essaye d'utiliser tes utilitaires existants (handEvaluator, poker)
 * via require() — si les modules/export attendus ne sont pas présents,
 * il tombe sur des heuristiques simples pour fournir un conseil.
 */

export async function analyzeHand(content: string): Promise<{
  advice: 'CALL' | 'FOLD' | 'RAISE' | 'CHECK' | 'UNKNOWN';
  reason: string;
  meta: Record<string, any>;
}> {
  // Normaliser le contenu
  const text = (content || '').toString();

  // Tentative d'import dynamique de tes utilitaires existants
  let handEvalModule: any = null;
  let pokerModule: any = null;

  try {
    handEvalModule = require(path.resolve(__dirname, '../utils/handEvaluator'));
  } catch (e) {
    try {
      handEvalModule = require(path.resolve(__dirname, '../../src/utils/handEvaluator'));
    } catch (e2) {
      handEvalModule = null;
    }
  }

  try {
    pokerModule = require(path.resolve(__dirname, '../utils/poker'));
  } catch (e) {
    try {
      pokerModule = require(path.resolve(__dirname, '../../src/utils/poker'));
    } catch (e2) {
      pokerModule = null;
    }
  }

  // helper: extract first numeric value after a keyword
  const extractNumberAfter = (regex: RegExp) => {
    const m = text.match(regex);
    if (!m) return null;
    const num = m[1] ? m[1].replace(/[^\d.]/g, '') : null;
    return num ? Number(num) : null;
  };

  // Essayer d'extraire pot et bet depuis le texte (heuristique)
  const pot = extractNumberAfter(/Pot[: ]+([0-9.,]+)/i) ?? extractNumberAfter(/pot[: ]+([0-9.,]+)/i);
  const toCall = extractNumberAfter(/calls?[: ]+([0-9.,]+)/i) ?? extractNumberAfter(/to call[: ]+([0-9.,]+)/i);

  // Essayer d'extraire les cartes fermées (hole cards)
  // Winamax often prints something like: "Dealt to Player [Ah Kh]" or "Holecards [Ah Kh]"
  const cardsMatch = text.match(/\[([2-9ATJQK]{1}[hdcs]?[\s,]+[2-9ATJQK]{1}[hdcs]?)\]/i)
    || text.match(/Dealt to .* \[([2-9ATJQK]{1}[hdcs]?[\s,]+[2-9ATJQK]{1}[hdcs]?)\]/i)
    || text.match(/Hole cards?:\s*([2-9ATJQK]{1}[hdcs]?\s+[2-9ATJQK]{1}[hdcs]?)/i);

  const holecards = cardsMatch ? cardsMatch[1].replace(/\s+/g, ' ').trim() : null;

  // If hand evaluator exists, try to get hand strength
  let handStrength: any = null;
  try {
    if (handEvalModule) {
      // try a bunch of common exported names
      const fn = handEvalModule.evaluateHand || handEvalModule.evaluate || handEvalModule.handStrength || handEvalModule.getHandStrength;
      if (typeof fn === 'function') {
        // pass the raw content — modules often parse strings
        handStrength = fn(text);
      } else {
        // If module exports a default object with functions
        const defaultFn = handEvalModule.default && (handEvalModule.default.evaluateHand || handEvalModule.default.evaluate);
        if (typeof defaultFn === 'function') handStrength = defaultFn(text);
      }
    }
  } catch (e) {
    // ignore — we'll fallback to heuristics
    handStrength = null;
  }

  // If poker module exists, try potOdds calculation
  let potOddsValue: number | null = null;
  try {
    if (pokerModule) {
      const potOddsFn = pokerModule.potOdds || pokerModule.calculatePotOdds || pokerModule.getPotOdds;
      if (typeof potOddsFn === 'function' && pot != null && toCall != null) {
        // many implementations potOdds(bet, pot) — pass toCall and pot
        potOddsValue = potOddsFn(toCall, pot);
      }
    }
  } catch (e) {
    potOddsValue = null;
  }

  // Simple heuristic fallback when no evaluator:
  if (!handStrength) {
    // naive heuristic from holecards if available
    let heuristicStrength = 'unknown';
    if (holecards) {
      const hc = holecards.toUpperCase().replace(/[, ]+/g, ' ').split(' ');
      const ranks = hc.map(c => c[0]);
      // pocket pair?
      if (ranks[0] === ranks[1]) heuristicStrength = 'pair';
      // high card both A or K
      else if (ranks.includes('A') || ranks.includes('K')) heuristicStrength = 'high';
      else heuristicStrength = 'medium';
    }
    handStrength = { summary: heuristicStrength };
  }

  // Decision logic (simple first iteration)
  // - If evaluator returns a "strong" signal → RAISE
  // - If pot odds are favorable and hand is medium/high → CALL
  // - Otherwise → FOLD
  let advice: 'CALL' | 'FOLD' | 'RAISE' | 'CHECK' | 'UNKNOWN' = 'UNKNOWN';
  let reason = '';

  const summary = typeof handStrength === 'string'
    ? handStrength
    : handStrength?.summary || '';

  const summaryLower = summary.toLowerCase();

  if (summaryLower.includes('straight') || summaryLower.includes('flush') || summaryLower.includes('full')) {
    advice = 'RAISE';
    reason = 'Main très forte détectée.';
  } else if (summaryLower.includes('pair') || summaryLower.includes('high')) {
    if (potOddsValue && potOddsValue < 0.25) {
      advice = 'CALL';
      reason = 'Bonne cote du pot et main décente.';
    } else {
      advice = 'CHECK';
      reason = 'Main moyenne, prudence.';
    }
  } else {
    advice = 'FOLD';
    reason = 'Main faible ou situation défavorable.';
  }

  // Meta infos
  const meta = {
    holecards,
    pot,
    toCall,
    potOdds: potOddsValue,
    evaluatorUsed: !!handEvalModule,
  };

  return { advice, reason, meta };
}
