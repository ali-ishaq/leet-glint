export interface ProblemSnapshot {
  problemText: string;
  code: string;
  failingTest: {
    input: string;
    expected: string;
    actual: string;
  } | null;
}

/**
 * Attributes first, and in this order for a reason: LeetCode's own classes are
 * CSS-module build hashes (HTMLContent_html__0OZLp) that are regenerated on their
 * deploys, so anything derived from them silently stops matching. The
 * data-qd-rendered-description attribute is present specifically to mark the
 * rendered statement.
 */
const PROBLEM_CONTAINER_SELECTORS = [
  "[data-qd-rendered-description]",
  '[data-track-load="description_content"]',
  ".question-content",
  ".markdown",
  ".problems-container",
];

const MAX_SELECTION_CHARS = 2000;

export function getProblemContainer(): Element | null {
  for (const selector of PROBLEM_CONTAINER_SELECTORS) {
    const node = document.querySelector(selector);
    if (node) {
      return node;
    }
  }

  return null;
}

export function getProblemText(): string {
  const node = getProblemContainer();
  if (node) {
    return node.textContent?.replace(/\s+/g, " ").trim() ?? "";
  }

  return document.body.innerText.replace(/\s+/g, " ").trim();
}

export function getProblemSelection(): string | null {
  const container = getProblemContainer();
  if (!container) {
    return null;
  }

  const selection = window.getSelection();
  if (!selection || selection.isCollapsed || selection.rangeCount === 0) {
    return null;
  }

  // The innermost node spanning the whole range. It sits inside the container
  // for a selection made in the description, and above it for one that runs off
  // into the editor or the console, which is what rejects the latter.
  const range = selection.getRangeAt(0);
  if (!container.contains(range.commonAncestorContainer)) {
    return null;
  }

  const selected = selection.toString().replace(/\s+/g, " ").trim();
  if (!selected) {
    return null;
  }

  return selected.length > MAX_SELECTION_CHARS
    ? `${selected.slice(0, MAX_SELECTION_CHARS).trimEnd()}…`
    : selected;
}

export function getEditorCode(): string {
  const editors = document.querySelectorAll(".view-lines, .monaco-editor");
  if (editors.length === 0) {
    return "";
  }

  const combined = Array.from(editors)
    .map((node) => node.textContent ?? "")
    .join("\n");

  return combined.replace(/\s+/g, " ").trim();
}

export function getFailingTestData(): {
  input: string;
  expected: string;
  actual: string;
} | null {
  const testPanel = document.querySelector(
    '[data-testid="testcase-panel"], .test-case-panel, .result-panel',
  );
  if (!testPanel) {
    return null;
  }

  const input =
    testPanel.querySelector('[data-testid="input"], .input, pre')
      ?.textContent ?? "";
  const expected =
    testPanel.querySelector(
      '[data-testid="expected"], .expected, .expected-output',
    )?.textContent ?? "";
  const actual =
    testPanel.querySelector('[data-testid="actual"], .actual, .result-output')
      ?.textContent ?? "";

  if (!input && !expected && !actual) {
    return null;
  }

  return {
    input: input.trim(),
    expected: expected.trim(),
    actual: actual.trim(),
  };
}

export function collectProblemSnapshot(): ProblemSnapshot {
  return {
    problemText: getProblemText(),
    code: getEditorCode(),
    failingTest: getFailingTestData(),
  };
}
