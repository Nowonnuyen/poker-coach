// testChat.ts
import { askChatGPT, openaiEnabled } from "./src/api/openaiClient";

(async () => {
  console.log("OpenAI activé ?", openaiEnabled);
  try {
    const prompt = "En une phrase : quel est le meilleur conseil pour jouer en position au poker cash NLHE ?";
    const answer = await askChatGPT(prompt);
    console.log("\n🧠 Réponse ChatGPT :\n", answer);
  } catch (err: any) {
    console.error("Erreur lors du test ChatGPT :", err?.message || err);
  }
})();
