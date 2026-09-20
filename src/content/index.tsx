import { createRoot } from "react-dom/client";
import { collectProblemSnapshot } from "./domReaders";
import { ClarifyButton } from "./ClarifyButton";
import { HintButton } from "./HintButton";
import { HINT_PROMPTS, CLARIFY_PROMPTS } from "../shared/prompts";
import { readSettings } from "../shared/storage";
import "../index.css";

const APP_ID = "leetglint-root";

function stableHash(value: string): string {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(i);
    hash |= 0;
  }
  return String(hash >>> 0);
}

async function requestAi(
  kind: "clarify" | "hint",
  level: number,
  userPrompt: string,
  systemPrompt: string,
): Promise<string> {
  const runtime = chrome?.runtime;
  const sendMessage = runtime?.sendMessage;

  if (!sendMessage) {
    throw new Error("Chrome runtime is unavailable.");
  }

  const response = await new Promise<{ ok?: boolean; response?: string }>(
    (resolve) => {
      sendMessage(
        {
          type: kind,
          level,
          systemPrompt,
          userPrompt,
        },
        resolve,
      );
    },
  );

  if (!response?.ok) {
    throw new Error(response?.response ?? "Request failed");
  }

  return response.response ?? "No response generated.";
}

function createApp() {
  const rootElement = document.createElement("div");
  rootElement.id = APP_ID;
  rootElement.className = "leetglint-root";
  const root = createRoot(rootElement);
  document.body.appendChild(rootElement);

  const state = {
    clarityLevel: 0,
    hintLevel: 0,
    hash: "",
    isHintDisabled: false,
  };

  function getClarifyPrompt(level: number): string {
    const snapshot = collectProblemSnapshot();
    const systemPrompt =
      CLARIFY_PROMPTS[level as keyof typeof CLARIFY_PROMPTS] ??
      CLARIFY_PROMPTS[1];
    return `Problem statement: ${snapshot.problemText}\n\nClarify level ${level}. ${systemPrompt}`;
  }

  function getHintPrompt(level: number): string {
    const snapshot = collectProblemSnapshot();
    const systemPrompt =
      HINT_PROMPTS[level as keyof typeof HINT_PROMPTS] ?? HINT_PROMPTS[1];
    const failingTest = snapshot.failingTest ?? {
      input: "N/A",
      expected: "N/A",
      actual: "N/A",
    };

    return `Problem statement: ${snapshot.problemText}\n\nUser code:\n${snapshot.code}\n\nFailing test data:\nInput: ${failingTest.input}\nExpected: ${failingTest.expected}\nActual: ${failingTest.actual}\n\nHint level ${level}. ${systemPrompt}`;
  }

  async function handleAction(
    kind: "clarify" | "hint",
    level: number,
  ): Promise<string> {
    const settings = await readSettings();
    if (!settings.apiKey) {
      throw new Error(
        "Add your API key on the LeetGlint options page before using this feature.",
      );
    }

    const systemPrompt =
      kind === "clarify"
        ? (CLARIFY_PROMPTS[level as keyof typeof CLARIFY_PROMPTS] ??
          CLARIFY_PROMPTS[1])
        : (HINT_PROMPTS[level as keyof typeof HINT_PROMPTS] ?? HINT_PROMPTS[1]);

    const prompt =
      kind === "clarify" ? getClarifyPrompt(level) : getHintPrompt(level);

    return requestAi(kind, level, prompt, systemPrompt);
  }

  function refreshHintState() {
    const snapshot = collectProblemSnapshot();
    const nextHash = stableHash(snapshot.code || "");

    if (state.hash && state.hash !== nextHash) {
      state.hintLevel = 0;
      state.isHintDisabled = false;
    }

    state.hash = nextHash;
  }

  function attachClarify() {
    const buttons = (
      <div>
        <ClarifyButton
          level={state.clarityLevel + 1}
          onRequest={handleAction}
        />
      </div>
    );

    root.render(buttons);
  }

  function attachHint() {
    const resultHeader = document.querySelector(
      '[data-testid="result-panel"], .result-panel, .test-result, .testcase-panel',
    );
    if (!resultHeader) {
      return;
    }

    const panel = (
      <HintButton
        target="hint"
        level={state.hintLevel + 1}
        onRequest={handleAction}
        disabled={state.isHintDisabled}
      />
    );

    const hintAnchor = resultHeader.querySelector<HTMLElement>(
      ".leetglint-hint-anchor",
    );
    if (hintAnchor) {
      return;
    }

    const anchor = document.createElement("div");
    anchor.className = "leetglint-hint-anchor";
    resultHeader.appendChild(anchor);
    createRoot(anchor).render(panel);
  }

  return {
    refreshHintState,
    attachClarify,
    attachHint,
    setHintLevel(nextLevel: number) {
      state.hintLevel = nextLevel;
    },
    setClarifyLevel(nextLevel: number) {
      state.clarityLevel = nextLevel;
    },
    setHintDisabled(value: boolean) {
      state.isHintDisabled = value;
    },
  };
}

function setup() {
  const app = createApp();

  const observer = new MutationObserver(() => {
    app.refreshHintState();
    app.attachClarify();
    app.attachHint();
  });

  observer.observe(document.body, { childList: true, subtree: true });
  app.refreshHintState();
  app.attachClarify();
  app.attachHint();
}

setup();
