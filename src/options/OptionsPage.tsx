import { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  DEFAULT_SETTINGS,
  readSettings,
  writeSettings,
  type ProviderName,
} from "../shared/storage";
import "../index.css";

const providers = [
  { value: "gpt", label: "GPT (OpenAI)" },
  { value: "claude", label: "Claude (Anthropic)" },
  { value: "gemini", label: "Gemini (Google)" },
] as const;

const modelOptions: Record<ProviderName, string[]> = {
  gpt: ["gpt-4o-mini", "gpt-4.1-mini", "gpt-4o"],
  claude: ["claude-3-5-sonnet-latest", "claude-3-5-haiku-latest"],
  gemini: ["gemini-3-flash-preview", "gemini-3.5-flash"],
};

function OptionsPage() {
  const [provider, setProvider] = useState<ProviderName>(
    DEFAULT_SETTINGS.provider,
  );
  const [model, setModel] = useState(DEFAULT_SETTINGS.model);
  const [apiKey, setApiKey] = useState(DEFAULT_SETTINGS.apiKey);
  const [savedApiKey, setSavedApiKey] = useState(DEFAULT_SETTINGS.apiKey);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [status, setStatus] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  useEffect(() => {
    void (async () => {
      const settings = await readSettings();
      setProvider(settings.provider);
      setModel(settings.model);
      setApiKey(settings.apiKey);
      setSavedApiKey(settings.apiKey);
      setIsEditing(!settings.apiKey);
      setIsLoaded(true);
    })();
  }, []);

  function handleProviderChange(nextProvider: ProviderName) {
    setProvider(nextProvider);
    setModel(modelOptions[nextProvider][0]);
  }

  async function handleSave() {
    if (!apiKey.trim()) {
      setStatus({ type: "error", message: "Enter an API key before saving." });
      return;
    }

    setIsSaving(true);
    setStatus(null);
    try {
      await writeSettings({ provider, model, apiKey: apiKey.trim() });
      setApiKey(apiKey.trim());
      setSavedApiKey(apiKey.trim());
      setIsEditing(false);
      setStatus({
        type: "success",
        message: "API key saved securely in local storage.",
      });
    } catch {
      setStatus({
        type: "error",
        message: "Could not save the API key. Try again.",
      });
    } finally {
      setIsSaving(false);
    }
  }

  async function handleRemove() {
    if (!window.confirm("Remove the saved API key from this browser?")) {
      return;
    }

    await writeSettings({ apiKey: "" });
    setApiKey("");
    setSavedApiKey("");
    setIsEditing(true);
    setStatus({
      type: "success",
      message: "API key removed from this browser.",
    });
  }

  if (!isLoaded) {
    return (
      <main className="options-page">
        <section className="card settings-card">
          <p className="muted">Loading settings…</p>
        </section>
      </main>
    );
  }

  const hasApiKey = Boolean(savedApiKey);
  const maskedKey = hasApiKey
    ? `${savedApiKey.slice(0, 3)}••••${savedApiKey.slice(-4)}`
    : "";

  return (
    <main className="options-page">
      <section className="card settings-card">
        <div className="settings-intro">
          <p className="eyebrow">SETTINGS</p>
          <h1>Connect LeetGlint</h1>
          <p className="muted">
            Your key stays in Chrome local storage and is only sent to the
            provider you choose.
          </p>
        </div>
        {status && (
          <div className={`notice notice-${status.type}`} role="status">
            {status.message}
          </div>
        )}
        <div className="form-grid">
          <div className="label-row">
            <label htmlFor="provider">AI provider</label>
            <select
              id="provider"
              value={provider}
              onChange={(event) =>
                handleProviderChange(event.target.value as ProviderName)
              }
            >
              {providers.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className="label-row">
            <label htmlFor="model">Model</label>
            <select
              id="model"
              value={model}
              onChange={(event) => setModel(event.target.value)}
            >
              {(modelOptions[provider] ?? modelOptions.gpt).map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>

          {hasApiKey && !isEditing ? (
            <div className="saved-key-row">
              <div>
                <span className="field-label">API key</span>
                <strong className="masked-key">{maskedKey}</strong>
              </div>
              <span className="saved-badge">Saved</span>
            </div>
          ) : (
            <div className="label-row">
              <label htmlFor="api-key">API key</label>
              <input
                id="api-key"
                type="password"
                value={apiKey}
                onChange={(event) => setApiKey(event.target.value)}
                placeholder="Paste your key here"
                autoFocus={!hasApiKey}
              />
            </div>
          )}
        </div>

        {hasApiKey && !isEditing ? (
          <div className="inline-actions">
            <button
              className="secondary-button"
              type="button"
              onClick={() => {
                setIsEditing(true);
                setStatus(null);
              }}
            >
              Change key
            </button>
            <button
              className="text-button danger-text"
              type="button"
              onClick={() => void handleRemove()}
            >
              Remove
            </button>
          </div>
        ) : (
          <div className="inline-actions">
            <button
              className="primary-button"
              type="button"
              onClick={() => void handleSave()}
              disabled={isSaving}
            >
              {isSaving ? "Saving…" : "Save API key"}
            </button>
            {hasApiKey && (
              <button
                className="text-button"
                type="button"
                onClick={() => {
                  setApiKey(savedApiKey);
                  setIsEditing(false);
                  setStatus(null);
                }}
              >
                Cancel
              </button>
            )}
          </div>
        )}
      </section>
    </main>
  );
}

createRoot(document.getElementById("root")!).render(<OptionsPage />);
