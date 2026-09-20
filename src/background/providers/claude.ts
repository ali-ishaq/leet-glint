import type { AIProvider } from "./types";

export const claudeProvider: AIProvider = {
  name: "claude",
  async sendPrompt(systemPrompt, userPrompt, apiKey, model) {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model,
        max_tokens: 300,
        system: systemPrompt,
        messages: [{ role: "user", content: userPrompt }],
      }),
    });

    if (!response.ok) {
      const bodyText = await response.text();
      throw new Error(`Claude request failed: ${response.status} ${bodyText}`);
    }

    const data = await response.json();
    const text = Array.isArray(data.content)
      ? data.content.map((item: { text?: string }) => item.text ?? "").join("")
      : typeof data.content === "string"
        ? data.content
        : "";

    return text.trim();
  },
};
