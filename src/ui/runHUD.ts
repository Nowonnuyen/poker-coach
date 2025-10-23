// src/ui/runHUD.ts
import { spawn } from "child_process";
import path from "path";

export type HUDPayload = {
  handNumber: number;
  advice: string;
  mathAdvice?: string;
  emotionReport?: string;
  tableProfile?: string;
};

// 🔹 Fonction pour lancer le HUD Ink avec les données JSON
export function showPokerHUD(data: HUDPayload) {
  const inkPath = path.resolve(__dirname, "./inkHUD/index.tsx");

  const child = spawn("npx", ["tsx", inkPath], {
    stdio: "inherit",
    env: {
      ...process.env,
      SESSION_DATA: JSON.stringify(data),
    },
  });

  child.on("error", (err) => {
    console.error("❌ Erreur lors du lancement du HUD:", err);
  });
}
