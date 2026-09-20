export type ProviderName = "claude" | "gpt" | "gemini";

export interface AppSettings {
  provider: ProviderName;
  model: string;
  apiKey: string;
}

export const DEFAULT_SETTINGS: AppSettings = {
  provider: "gpt",
  model: "gpt-4o-mini",
  apiKey: "",
};

export async function readSettings(): Promise<AppSettings> {
  return new Promise((resolve) => {
    if (!chrome?.storage?.local) {
      resolve(DEFAULT_SETTINGS);
      return;
    }

    chrome.storage.local.get(
      ["provider", "model", "apiKey"],
      (items: Partial<AppSettings>) => {
        resolve({
          ...DEFAULT_SETTINGS,
          ...items,
        });
      },
    );
  });
}

export async function writeSettings(
  values: Partial<AppSettings>,
): Promise<void> {
  return new Promise((resolve) => {
    if (!chrome?.storage?.local) {
      resolve();
      return;
    }

    chrome.storage.local.set(values, () => resolve());
  });
}
