import dotenv from "dotenv";
dotenv.config();

import fetch, { Headers, Request, Response } from "node-fetch";
import { FormData, File, Blob } from "formdata-node";

(global as any).fetch = fetch;
(global as any).Headers = Headers;
(global as any).Request = Request;
(global as any).Response = Response;
(global as any).FormData = FormData;
(global as any).File = File;
(global as any).Blob = Blob;

import OpenAI from "openai";

const { OPENAI_API_KEY, OPENAI_ENABLED } = process.env;

export const openaiEnabled =
  Boolean(OPENAI_API_KEY) &&
  String(OPENAI_ENABLED || "false").toLowerCase() === "true";

export const openai = openaiEnabled
  ? new OpenAI({
      apiKey: OPENAI_API_KEY,
      fetch: fetch as any,
    })
  : (null as unknown as OpenAI);

export async function askChatGPT(prompt: string): Promise<string> {
  if (!openaiEnabled) return "⚠️ ChatGPT désactivé (OPENAI_ENABLED=false).";

  try {
    const resp = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.5,
      messages: [
        {
          role: "system",
          content:
            "Tu es un coach poker concis et pédagogique. Donne des conseils exploitables en 1-2 phrases.",
        },
        { role: "user", content: prompt },
      ],
    });

    return resp.choices[0]?.message?.content?.trim() || "Aucune réponse.";
  } catch (err: any) {
    console.error("Erreur API OpenAI:", err?.message || err);
    return "Erreur lors de la requête API.";
  }
}
