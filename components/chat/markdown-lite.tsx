"use client";

import { Fragment, useState, type ReactNode } from "react";
import { Check, Copy } from "lucide-react";

type Block =
  | { type: "paragraph"; text: string }
  | { type: "heading"; level: number; text: string }
  | { type: "list"; items: string[] }
  | { type: "ordered"; items: string[] }
  | { type: "code"; text: string; lang: string }
  | { type: "quote"; text: string };

function parseBlocks(content: string): Block[] {
  const lines = content.split("\n");
  const blocks: Block[] = [];
  let code: string[] | null = null;
  let codeLang = "";
  let paragraph: string[] = [];
  let list: string[] = [];
  let ordered: string[] = [];

  const flushParagraph = () => {
    if (paragraph.length > 0) {
      blocks.push({ type: "paragraph", text: paragraph.join(" ") });
      paragraph = [];
    }
  };
  const flushList = () => {
    if (list.length > 0) {
      blocks.push({ type: "list", items: list });
      list = [];
    }
    if (ordered.length > 0) {
      blocks.push({ type: "ordered", items: ordered });
      ordered = [];
    }
  };
  const flushAll = () => {
    flushParagraph();
    flushList();
  };

  for (const rawLine of lines) {
    if (code !== null) {
      if (rawLine.trimStart().startsWith("```")) {
        blocks.push({ type: "code", text: code.join("\n"), lang: codeLang });
        code = null;
        codeLang = "";
      } else {
        code.push(rawLine);
      }
      continue;
    }

    if (rawLine.trimStart().startsWith("```")) {
      flushAll();
      code = [];
      codeLang = rawLine.trim().slice(3).trim();
      continue;
    }

    if (!rawLine.trim()) {
      flushAll();
      continue;
    }

    const heading = rawLine.match(/^(#{1,3})\s+(.*)$/);
    if (heading) {
      flushAll();
      blocks.push({
        type: "heading",
        level: heading[1].length,
        text: heading[2],
      });
      continue;
    }

    const bullet = rawLine.match(/^\s*[-*]\s+(.*)$/);
    if (bullet) {
      flushParagraph();
      if (ordered.length > 0) flushList();
      list.push(bullet[1]);
      continue;
    }

    const numbered = rawLine.match(/^\s*\d+[.)]\s+(.*)$/);
    if (numbered) {
      flushParagraph();
      if (list.length > 0) flushList();
      ordered.push(numbered[1]);
      continue;
    }

    const quote = rawLine.match(/^>\s?(.*)$/);
    if (quote) {
      flushAll();
      blocks.push({ type: "quote", text: quote[1] });
      continue;
    }

    flushList();
    paragraph.push(rawLine.trim());
  }

  if (code !== null) {
    blocks.push({ type: "code", text: code.join("\n"), lang: codeLang });
  }
  flushAll();
  return blocks;
}

function renderInline(text: string): ReactNode[] {
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`|\*[^*]+\*)/g);
  return parts.map((part, index) => {
    if (part.startsWith("**") && part.endsWith("**") && part.length > 4) {
      return (
        <strong key={index} className="font-semibold text-[var(--text)]">
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith("`") && part.endsWith("`") && part.length > 2) {
      return (
        <code
          key={index}
          className="rounded-md border border-white/[0.06] bg-white/[0.06] px-1.5 py-0.5 font-mono text-[0.85em] text-[var(--accent)]"
        >
          {part.slice(1, -1)}
        </code>
      );
    }
    if (part.startsWith("*") && part.endsWith("*") && part.length > 2) {
      return (
        <em key={index} className="text-[var(--text)]">
          {part.slice(1, -1)}
        </em>
      );
    }
    return <Fragment key={index}>{part}</Fragment>;
  });
}

function CodeBlock({ code, lang }: { code: string; lang: string }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="my-3 overflow-hidden rounded-xl border border-[var(--border)] bg-[#07070f]">
      <div className="flex items-center justify-between border-b border-[var(--border)] px-3 py-1.5">
        <span className="font-mono text-[10px] uppercase tracking-wider text-[var(--faint)]">
          {lang || "code"}
        </span>
        <button
          type="button"
          onClick={copy}
          className="focus-ring flex items-center gap-1.5 rounded-md px-1.5 py-1 text-[10px] text-[var(--muted)] transition-colors hover:bg-white/[0.06] hover:text-[var(--text)]"
        >
          {copied ? (
            <Check className="size-3 text-[var(--success)]" />
          ) : (
            <Copy className="size-3" />
          )}
          {copied ? "Copié" : "Copier"}
        </button>
      </div>
      <pre className="scroll-area overflow-x-auto p-3.5">
        <code className="font-mono text-[12px] leading-6 text-[#d7def0]">
          {code}
        </code>
      </pre>
    </div>
  );
}

export function MarkdownLite({ content }: { content: string }) {
  const blocks = parseBlocks(content);

  return (
    <div className="min-w-0">
      {blocks.map((block, index) => {
        switch (block.type) {
          case "heading": {
            const className =
              block.level === 1
                ? "mb-2 mt-5 text-lg font-semibold text-[var(--text)]"
                : block.level === 2
                  ? "mb-2 mt-4 text-base font-semibold text-[var(--text)]"
                  : "mb-1.5 mt-3.5 text-[13px] font-semibold uppercase tracking-wide text-[var(--text)]";
            return (
              <p key={index} className={className}>
                {renderInline(block.text)}
              </p>
            );
          }
          case "paragraph":
            return (
              <p
                key={index}
                className="mt-2 text-[13.5px] leading-7 text-[#c3cbdc] first:mt-0"
              >
                {renderInline(block.text)}
              </p>
            );
          case "list":
            return (
              <ul key={index} className="my-2.5 space-y-1.5">
                {block.items.map((item, itemIndex) => (
                  <li
                    key={itemIndex}
                    className="flex gap-2.5 text-[13.5px] leading-6 text-[#c3cbdc]"
                  >
                    <span className="mt-2 size-1.5 shrink-0 rounded-full accent-gradient" />
                    <span className="min-w-0">{renderInline(item)}</span>
                  </li>
                ))}
              </ul>
            );
          case "ordered":
            return (
              <ol key={index} className="my-2.5 space-y-1.5">
                {block.items.map((item, itemIndex) => (
                  <li
                    key={itemIndex}
                    className="flex gap-2.5 text-[13.5px] leading-6 text-[#c3cbdc]"
                  >
                    <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-md border border-[rgba(var(--accent-rgb),0.2)] bg-[rgba(var(--accent-rgb),0.1)] font-mono text-[10px] font-semibold text-[var(--accent)]">
                      {itemIndex + 1}
                    </span>
                    <span className="min-w-0">{renderInline(item)}</span>
                  </li>
                ))}
              </ol>
            );
          case "code":
            return (
              <CodeBlock key={index} code={block.text} lang={block.lang} />
            );
          case "quote":
            return (
              <blockquote
                key={index}
                className="my-3 border-l-2 border-[var(--accent)] pl-3 text-[13px] italic leading-6 text-[var(--muted)]"
              >
                {renderInline(block.text)}
              </blockquote>
            );
          default:
            return null;
        }
      })}
    </div>
  );
}
