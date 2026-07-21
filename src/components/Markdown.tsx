import React from 'react';

interface MarkdownProps {
  content: string;
}

export default function Markdown({ content }: MarkdownProps) {
  if (!content) return null;

  // Split content by code blocks to format code separately
  const parts = content.split(/(```[\s\S]*?```)/g);

  return (
    <div className="space-y-3 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
      {parts.map((part, index) => {
        if (part.startsWith('```')) {
          // It's a code block
          const lines = part.split('\n');
          const firstLine = lines[0];
          const language = firstLine.replace('```', '').trim() || 'code';
          const code = lines.slice(1, -1).join('\n');

          return (
            <div key={index} className="my-3 overflow-hidden rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-900 text-slate-100 font-mono text-xs">
              <div className="flex items-center justify-between bg-slate-850 px-4 py-1.5 text-[10px] text-slate-400 uppercase font-sans border-b border-slate-800">
                <span>{language}</span>
                <span className="text-[9px] lowercase">syntax highlighted</span>
              </div>
              <pre className="p-4 overflow-x-auto">
                <code>{code}</code>
              </pre>
            </div>
          );
        }

        // It's regular text, split by lines
        const lines = part.split('\n');
        return (
          <div key={index} className="space-y-2">
            {lines.map((line, lIdx) => {
              const trimmed = line.trim();

              // Empty lines
              if (!trimmed) {
                return <div key={lIdx} className="h-2" />;
              }

              // Headings
              if (trimmed.startsWith('### ')) {
                return (
                  <h3 key={lIdx} className="text-base font-semibold text-slate-900 dark:text-white pt-2 flex items-center">
                    {trimmed.replace('### ', '')}
                  </h3>
                );
              }
              if (trimmed.startsWith('## ')) {
                return (
                  <h2 key={lIdx} className="text-lg font-bold text-slate-900 dark:text-white pt-3 border-b border-slate-100 dark:border-slate-800 pb-1">
                    {trimmed.replace('## ', '')}
                  </h2>
                );
              }
              if (trimmed.startsWith('# ')) {
                return (
                  <h1 key={lIdx} className="text-xl font-black text-slate-900 dark:text-white pt-4">
                    {trimmed.replace('# ', '')}
                  </h1>
                );
              }

              // List Items (Bullet)
              if (trimmed.startsWith('* ') || trimmed.startsWith('- ')) {
                const text = trimmed.replace(/^[\*\-]\s+/, '');
                return (
                  <ul key={lIdx} className="list-disc pl-5 space-y-1">
                    <li className="text-slate-700 dark:text-slate-300">
                      {parseInlineFormatting(text)}
                    </li>
                  </ul>
                );
              }

              // List Items (Numbered)
              if (/^\d+\.\s+/.test(trimmed)) {
                const text = trimmed.replace(/^\d+\.\s+/, '');
                const num = trimmed.match(/^\d+/)?.toString() || '1';
                return (
                  <ol key={lIdx} className="list-decimal pl-5 space-y-1">
                    <li className="text-slate-700 dark:text-slate-300">
                      <span className="font-semibold text-indigo-600 dark:text-indigo-400 mr-1">{num}.</span>
                      {parseInlineFormatting(text)}
                    </li>
                  </ol>
                );
              }

              // Normal paragraph line
              return (
                <p key={lIdx} className="text-slate-700 dark:text-slate-300">
                  {parseInlineFormatting(trimmed)}
                </p>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}

// Simple parsing helper for **bold** and `code` tags inline
function parseInlineFormatting(text: string) {
  // Regex to match code or bold spans
  const parts = text.split(/(\*\*.*?\*\*|`.*?`|\$\$.*?\$\$)/g);
  
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i} className="font-bold text-slate-900 dark:text-white">{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith('`') && part.endsWith('`')) {
      return (
        <code key={i} className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 font-mono text-xs text-indigo-600 dark:text-indigo-400 border border-slate-200 dark:border-slate-700">
          {part.slice(1, -1)}
        </code>
      );
    }
    if (part.startsWith('$$') && part.endsWith('$$')) {
      // Simple render for equations/formulas
      return (
        <span key={i} className="inline-block px-2 py-1 my-1 rounded bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 font-mono text-sm border border-indigo-100 dark:border-indigo-900/50">
          {part.slice(2, -2)}
        </span>
      );
    }
    return part;
  });
}
