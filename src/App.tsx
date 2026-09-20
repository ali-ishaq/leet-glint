import { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { readSettings } from "./shared/storage";
import "./index.css";

function App() {
  const [hasApiKey, setHasApiKey] = useState<boolean | null>(null);

  useEffect(() => {
    void readSettings().then((settings) =>
      setHasApiKey(Boolean(settings.apiKey)),
    );
  }, []);

  const openSettings = () => {
    const runtime = chrome?.runtime;
    const tabs = chrome?.tabs;

    if (runtime && tabs && runtime.getURL) {
      tabs.create({ url: runtime.getURL("options.html") });
    }
  };

  if (hasApiKey === null) {
    return (
      <main className="popup-page">
        <section className="card popup-card">
          <div className="brand-mark" aria-hidden="true">
            L
          </div>
          <p className="eyebrow">LEETCODE COMPANION</p>
          <h1>LeetGlint</h1>
          <p className="muted">Checking your connection…</p>
        </section>
      </main>
    );
  }

  return (
    <main className="popup-page">
      <section className="card popup-card">
        <div className="popup-header">
          <div>
            <p className="eyebrow">LEETCODE COMPANION</p>
            <h1>LeetGlint</h1>
          </div>
          <div className="brand-mark" aria-hidden="true">
            L
          </div>
        </div>

        {hasApiKey ? (
          <>
            <div className="connected-state">
              <span className="status-dot" aria-hidden="true" />
              <div>
                <strong>Connected</strong>
                <p className="muted">Your nudge engine is ready on LeetCode.</p>
              </div>
            </div>
            <p className="popup-copy">
              Clarify confusing wording or get a focused pointer after a failed
              test.
            </p>
            <button
              className="secondary-button full-button"
              type="button"
              onClick={openSettings}
            >
              Manage API key
            </button>
          </>
        ) : (
          <>
            <p className="eyebrow accent-eyebrow">ONE SMALL SETUP STEP</p>
            <h2>Connect your AI provider</h2>
            <p className="popup-copy">
              Add an API key to unlock plain-language clarifications and
              debugging nudges.
            </p>
            <button
              className="primary-button full-button"
              type="button"
              onClick={openSettings}
            >
              Add API key <span aria-hidden="true">→</span>
            </button>
          </>
        )}
      </section>
    </main>
  );
}

export default App;

createRoot(document.getElementById("root")!).render(<App />);
