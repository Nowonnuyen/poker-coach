// src/analyzer/liveAnalyzer.ts
import path from "path";
import { askChatGPT, openaiEnabled } from "../api/openaiClient";

/**
 * analyzeHand(content)
 * - content: texte brut d'une main (Winamax)
 * - retourne un objet {advice, reason, meta}
 */

export async function analyzeHand(content: string): Promise<{
  advice: "CALL" | "FOLD" | "RAISE" | "CHECK" | "UNKNOWN";
  reason: string;
  meta: Record<string, any>;
}> {
  const text = (content || "").toString();

  let handEvalModule: any = null;
  let pokerModule: any = null;

  // ✅ Tentative d’import dynamique des utilitaires (si présents)
  try {
    handEvalModule = require(path.resolve(__dirname, "../utils/handEvaluator"));
  } catch {
    try {
      handEvalModule = require(path.resolve(
        __dirname,
        "../../src/utils/handEvaluator"
      ));
    } catch {
      handEvalModule = null;
    }
  }

  try {
    pokerModule = require(path.resolve(__dirname, "../utils/poker"));
  } catch {
    try {
      pokerModule = require(path.resolve(__dirname, "../../src/utils/poker"));
    } catch {
      pokerModule = null;
    }
  }

  // 🔍 Extraction heuristique des valeurs
  const extractNumberAfter = (regex: RegExp) => {
    const m = text.match(regex);
    if (!m) return null;
    const num = m[1] ? m[1].replace(/[^\d.]/g, "") : null;
    return num ? Number(num) : null;
  };

  const pot =
    extractNumberAfter(/Pot[: ]+([0-9.,]+)/i) ??
    extractNumberAfter(/pot[: ]+([0-9.,]+)/i);
  const toCall =
    extractNumberAfter(/calls?[: ]+([0-9.,]+)/i) ??
    extractNumberAfter(/to call[: ]+([0-9.,]+)/i);

  const cardsMatch =
    text.match(/\[([2-9ATJQK]{1}[hdcs]?[\s,]+[2-9ATJQK]{1}[hdcs]?)\]/i) ||
    text.match(
      /Dealt to .* \[([2-9ATJQK]{1}[hdcs]?[\s,]+[2-9ATJQK]{1}[hdcs]?)\]/i
    ) ||
    text.match(
      /Hole cards?:\s*([2-9ATJQK]{1}[hdcs]?\s+[2-9ATJQK]{1}[hdcs]?)/i
    );

  const holecards = cardsMatch
    ? cardsMatch[1].replace(/\s+/g, " ").trim()
    : null;

  // 🔢 Évaluation automatique si module dispo
  let handStrength: any = null;
  try {
    if (handEvalModule) {
      const fn =
        handEvalModule.evaluateHand ||
        handEvalModule.evaluate ||
        handEvalModule.handStrength ||
        handEvalModule.getHandStrength;
      if (typeof fn === "function") {
        handStrength = fn(text);
      } else {
        const defaultFn =
          handEvalModule.default &&
          (handEvalModule.default.evaluateHand ||
            handEvalModule.default.evaluate);
        if (typeof defaultFn === "function")
          handStrength = defaultFn(text);
      }
    }
  } catch {
    handStrength = null;
  }

  // ♠️ Pot odds (si module présent)
  let potOddsValue: number | null = null;
  try {
    if (pokerModule) {
      const potOddsFn =
        pokerModule.potOdds ||
        pokerModule.calculatePotOdds ||
        pokerModule.getPotOdds;
      if (typeof potOddsFn === "function" && pot != null && toCall != null) {
        potOddsValue = potOddsFn(toCall, pot);
      }
    }
  } catch {
    potOddsValue = null;
  }

  // 💡 Fallback : heuristique simple si pas d’analyseur
  if (!handStrength) {
    let heuristicStrength = "unknown";
    if (holecards) {
      const hc = holecards.toUpperCase().replace(/[, ]+/g, " ").split(" ");
      const ranks = hc.map((c) => c[0]);
      if (ranks[0] === ranks[1]) heuristicStrength = "pair";
      else if (ranks.includes("A") || ranks.includes("K"))
        heuristicStrength = "high";
      else heuristicStrength = "medium";
    }
    handStrength = { summary: heuristicStrength };
  }

  // 🎯 Logique de décision basique
  let advice: "CALL" | "FOLD" | "RAISE" | "CHECK" | "UNKNOWN" = "UNKNOWN";
  let reason = "";

  const summary =
    typeof handStrength === "string"
      ? handStrength
      : handStrength?.summary || "";

  const summaryLower = summary.toLowerCase();

  if (
    summaryLower.includes("straight") ||
    summaryLower.includes("flush") ||
    summaryLower.includes("full")
  ) {
    advice = "RAISE";
    reason = "Main très forte détectée.";
  } else if (summaryLower.includes("pair") || summaryLower.includes("high")) {
    if (potOddsValue && potOddsValue < 0.25) {
      advice = "CALL";
      reason = "Bonne cote du pot et main décente.";
    } else {
      advice = "CHECK";
      reason = "Main moyenne, prudence.";
    }
  } else {
    advice = "FOLD";
    reason = "Main faible ou situation défavorable.";
  }

  const meta = {
    holecards,
    pot,
    toCall,
    potOdds: potOddsValue,
    evaluatorUsed: !!handEvalModule,
  };

  return { advice, reason, meta };
}

/**
 * 🧠 getLiveAdviceFromAI()
 * Fournit un commentaire court de ChatGPT sur la main.
 */
export async function getLiveAdviceFromAI(handText: string): Promise<string> {
  if (!openaiEnabled) return "";

  try {
    const prompt = `
Tu es un coach poker expérimenté. Voici une main complète jouée par le héros (NonoBasket).
Analyse la qualité des décisions et propose une suggestion claire et concrète pour mieux jouer ce spot.
Main :
${handText}
    `.trim();

    const response = await askChatGPT(prompt);
    return response ? "💬 " + response : "";
  } catch (err: any) {
    console.error("Erreur getLiveAdviceFromAI:", err?.message || err);
    return "";
  }
}
