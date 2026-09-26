import Markdown from "react-markdown";
import rehypeHighlight from "rehype-highlight";
import rehypeKatex from "rehype-katex";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";

interface MarkdownContentProps {
  text: string;
}

export default function MarkdownContent({ text }: MarkdownContentProps) {
  return (
    <div className="leetglint-markdown">
      <Markdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[
          rehypeKatex,
          [rehypeHighlight, { detect: true, ignoreMissing: true }],
        ]}
        components={{
          // Picking only the props that belong on a DOM anchor: react-markdown
          // also passes a `node` hast element, which React warns about.
          a: ({ children, href, title }) => (
            <a href={href} title={title} target="_blank" rel="noopener noreferrer">
              {children}
            </a>
          ),
        }}
      >
        {text}
      </Markdown>
    </div>
  );
}
