import type { AIProvider } from "./types";

export const geminiProvider: AIProvider = {
  name: "gemini",
  async sendPrompt(systemPrompt, userPrompt, apiKey, model) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: systemPrompt }] },
        contents: [{ role: "user", parts: [{ text: userPrompt }] }],
      }),
    });

    if (!response.ok) {
      const bodyText = await response.text();
      throw new Error(`Gemini request failed: ${response.status} ${bodyText}`);
    }

    const data = await response.json();
    const text =
      data.candidates?.[0]?.content?.parts
        ?.map((part: { text?: string }) => part.text ?? "")
        .join("") ?? "No response generated.";

    return text.trim();
  },
};
