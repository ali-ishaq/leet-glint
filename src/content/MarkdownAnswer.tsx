import { Component, type ErrorInfo, type ReactNode } from "react";
import MarkdownContent from "./MarkdownContent";
import { loadKatexStyles } from "./katexStyles";

interface MarkdownAnswerProps {
  text: string;
}

interface PlainTextProps {
  text: string;
}

function PlainText({ text }: PlainTextProps) {
  return <p className="leetglint-markdown-plain">{text}</p>;
}

interface MarkdownBoundaryState {
  failed: boolean;
}

class MarkdownBoundary extends Component<
  MarkdownAnswerProps & { children: ReactNode },
  MarkdownBoundaryState
> {
  state: MarkdownBoundaryState = { failed: false };

  static getDerivedStateFromError(): MarkdownBoundaryState {
    // A malformed response must never take the popover down with it, so any
    // render failure falls back to the raw text.
    return { failed: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.warn("LeetGlint: markdown rendering failed, showing plain text.", error, info);
  }

  render() {
    if (this.state.failed) {
      return <PlainText text={this.props.text} />;
    }
    return this.props.children;
  }
}

export function MarkdownAnswer({ text }: MarkdownAnswerProps) {
  // Idempotent, and requested as soon as there is something to render rather
  // than on page load.
  void loadKatexStyles();

  // MarkdownContent is imported statically on purpose. A dynamic import() in a
  // content script goes through the page's module loader, so it is rejected by
  // the site CSP and throws "Failed to fetch dynamically imported module" on
  // leetcode.com. Keeping it in the content script bundle costs some bytes but
  // it always resolves.
  return (
    <MarkdownBoundary text={text}>
      <MarkdownContent text={text} />
    </MarkdownBoundary>
  );
}
