export interface ProblemSnapshot {
  problemText: string;
  code: string;
  failingTest: {
    input: string;
    expected: string;
    actual: string;
  } | null;
}

export function getProblemText(): string {
  const selectors = [
    ".content__u3I1",
    ".question-content",
    ".markdown",
    ".problems-container",
    '[data-track-load="description"]',
  ];

  for (const selector of selectors) {
    const node = document.querySelector(selector);
    if (node) {
      return node.textContent?.replace(/\s+/g, " ").trim() ?? "";
    }
  }

  return document.body.innerText.replace(/\s+/g, " ").trim();
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
