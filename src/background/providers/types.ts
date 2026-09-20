export type ProviderName = "claude" | "gpt" | "gemini";

export interface AIProvider {
  name: ProviderName;
  sendPrompt: (
    systemPrompt: string,
    userPrompt: string,
    apiKey: string,
    model: string,
  ) => Promise<string>;
}
