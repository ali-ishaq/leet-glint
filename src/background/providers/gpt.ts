import type { AIProvider } from "./types";

export const gptProvider: AIProvider = {
  name: "gpt",
  async sendPrompt(systemPrompt, userPrompt, apiKey, model) {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      const bodyText = await response.text();
      throw new Error(`OpenAI request failed: ${response.status} ${bodyText}`);
    }

    const data = await response.json();
    return (
      data.choices?.[0]?.message?.content?.trim() ?? "No response generated."
    );
  },
};
