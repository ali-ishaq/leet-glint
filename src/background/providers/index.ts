import type { AIProvider, ProviderName } from "./types";
import { claudeProvider } from "./claude";
import { geminiProvider } from "./gemini";
import { gptProvider } from "./gpt";

export const providers: Record<ProviderName, AIProvider> = {
  claude: claudeProvider,
  gpt: gptProvider,
  gemini: geminiProvider,
};

export function getProviderByName(name: ProviderName): AIProvider {
  return providers[name] ?? gptProvider;
}
