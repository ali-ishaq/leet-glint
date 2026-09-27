import { createRoot, type Root } from "react-dom/client";
import { collectProblemSnapshot } from "./domReaders";
import { ClarifyButton } from "./ClarifyButton";
import { HintButton } from "./HintButton";
import { createWrongAnswerButtonHost } from "./wrongAnswerButton";
import {
  HINT_PROMPTS,
  CLARIFY_PROMPT,
  CLARIFY_SELECTION_PROMPT,
  WRONG_ANSWER_HINT_PROMPT,
} from "../shared/prompts";
import { readSettings } from "../shared/storage";
import "./markdownStyles";
import "../index.css";

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

async function requireApiKey(): Promise<void> {
  const settings = await readSettings();
  if (!settings.apiKey) {
    throw new Error(
      "Add your API key on the LeetGlint options page before using this feature.",
    );
  }
}

function createApp() {
  const state = {
    hintLevel: 0,
    hash: "",
    isHintDisabled: false,
  };

  function getClarifyPrompt(): string {
    const snapshot = collectProblemSnapshot();
    return `Problem statement: ${snapshot.problemText}\n\n${CLARIFY_PROMPT}`;
  }

  /**
   * A non-null selection is the mode switch: the statement is still sent whole,
   * because the highlight gives the question its focus but the surrounding text
   * is what makes the answer correct.
   */
  function getClarifySelectionPrompt(selectedText: string): string {
    const snapshot = collectProblemSnapshot();

    return [
      `Problem statement: ${snapshot.problemText}`,
      "",
      "Text the developer highlighted:",
      `> ${selectedText}`,
      "",
      CLARIFY_SELECTION_PROMPT,
    ].join("\n");
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

  /**
   * The console grades a submission as Wrong Answer, so this prompt carries the
   * statement, the exact submission and the failing test values. Four backticks
   * fence the code so a nested triple-fence in the submission cannot end it.
   */
  function getWrongAnswerPrompt(): string {
    const snapshot = collectProblemSnapshot();
    const failingTest = snapshot.failingTest ?? {
      input: "N/A",
      expected: "N/A",
      actual: "N/A",
    };

    return [
      `Problem statement: ${snapshot.problemText}`,
      "",
      "Submitted code:",
      "````",
      snapshot.code,
      "````",
      "",
      "Verdict: Wrong Answer on at least one test case.",
      `Failing test input: ${failingTest.input}`,
      `Expected output: ${failingTest.expected}`,
      `Actual output: ${failingTest.actual}`,
      "",
      WRONG_ANSWER_HINT_PROMPT,
    ].join("\n");
  }

  async function requestClarify(selection: string | null): Promise<string> {
    await requireApiKey();

    return selection
      ? requestAi(
          "clarify",
          getClarifySelectionPrompt(selection),
          CLARIFY_SELECTION_PROMPT,
        )
      : requestAi("clarify", getClarifyPrompt(), CLARIFY_PROMPT);
  }

  async function requestHint(level: number): Promise<string> {
    await requireApiKey();

    const systemPrompt =
      HINT_PROMPTS[level as keyof typeof HINT_PROMPTS] ?? HINT_PROMPTS[1];

    return requestAi("hint", getHintPrompt(level), systemPrompt);
  }

  async function requestWrongAnswerHint(): Promise<string> {
    await requireApiKey();
    return requestAi("hint", getWrongAnswerPrompt(), WRONG_ANSWER_HINT_PROMPT);
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
    // The difficulty pill is only used to find where the trigger belongs; the
    // button itself is styled to match the Submit button, not the pill.
    const difficulty = document.querySelector<HTMLElement>(
      '[class*="text-difficulty-"]',
    );
    const pillContainer = difficulty?.parentElement;
    if (!pillContainer) {
      return;
    }

    const clarifyAnchor = pillContainer.querySelector<HTMLElement>(
      ".leetglint-clarify-anchor",
    );
    const anchor = clarifyAnchor ?? document.createElement("div");
    anchor.className = "leetglint-clarify-anchor";

    if (pillContainer.lastElementChild !== anchor) {
      pillContainer.appendChild(anchor);
    }

    if (!clarifyAnchor) {
      createRoot(anchor).render(<ClarifyButton onRequest={requestClarify} />);
    }
  }

  function attachHint() {
    const resultHeader = document.querySelector(
      '[data-testid="result-panel"], .result-panel, .test-result, .testcase-panel',
    );
    if (!resultHeader) {
      return;
    }

    if (resultHeader.querySelector(".leetglint-hint-anchor")) {
      return;
    }

    const anchor = document.createElement("div");
    anchor.className = "leetglint-hint-anchor";
    resultHeader.appendChild(anchor);
    createRoot(anchor).render(
      <HintButton
        label={`Hint ${state.hintLevel + 1} of 3`}
        onRequest={() => requestHint(state.hintLevel + 1)}
        disabled={state.isHintDisabled}
      />,
    );
  }

  /**
   * The console icon and the Wrong Answer verdict are rendered together, so the
   * button is reconciled with the verdict on every mutation instead of being
   * injected once. Only one anchor can ever be mounted: createRoot() throws if
   * it is called twice on the same node.
   */
  let wrongAnswerRoot: Root | null = null;
  const wrongAnswerButton = createWrongAnswerButtonHost({
    mount(anchor) {
      wrongAnswerRoot = createRoot(anchor);
      wrongAnswerRoot.render(
        <HintButton
          label="Hint"
          onRequest={requestWrongAnswerHint}
          disabled={state.isHintDisabled}
        />,
      );
    },
    unmount() {
      wrongAnswerRoot?.unmount();
      wrongAnswerRoot = null;
    },
  });

  function syncHintButton() {
    wrongAnswerButton.sync();
  }

  return {
    refreshHintState,
    attachClarify,
    attachHint,
    syncHintButton,
    setHintLevel(nextLevel: number) {
      state.hintLevel = nextLevel;
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
    app.syncHintButton();
  });

  observer.observe(document.body, { childList: true, subtree: true });
  app.refreshHintState();
  app.attachClarify();
  app.attachHint();
  app.syncHintButton();
}

setup();
