/**
 * CodeBlock Component
 *
 * Syntax-highlighted code block with copy-to-clipboard functionality.
 * Uses react-syntax-highlighter for syntax highlighting.
 */

import React, { useState } from 'react';
import { CheckIcon, ClipboardDocumentIcon } from '@/components/icons';
import { cn } from '@/lib/utils';

// Lightweight Prism-only highlighter with per-language lazy loading
const PRISM_LANG_LOADERS: Record<string, () => Promise<any>> = {
  javascript: () => import('react-syntax-highlighter/dist/esm/languages/prism/javascript'),
  typescript: () => import('react-syntax-highlighter/dist/esm/languages/prism/typescript'),
  tsx: () => import('react-syntax-highlighter/dist/esm/languages/prism/tsx'),
  jsx: () => import('react-syntax-highlighter/dist/esm/languages/prism/jsx'),
  json: () => import('react-syntax-highlighter/dist/esm/languages/prism/json'),
  bash: () => import('react-syntax-highlighter/dist/esm/languages/prism/bash'),
  shell: () => import('react-syntax-highlighter/dist/esm/languages/prism/bash'),
  python: () => import('react-syntax-highlighter/dist/esm/languages/prism/python'),
  sql: () => import('react-syntax-highlighter/dist/esm/languages/prism/sql'),
  markdown: () => import('react-syntax-highlighter/dist/esm/languages/prism/markdown'),
  yaml: () => import('react-syntax-highlighter/dist/esm/languages/prism/yaml'),
  yml: () => import('react-syntax-highlighter/dist/esm/languages/prism/yaml'),
  html: () => import('react-syntax-highlighter/dist/esm/languages/prism/markup'),
  css: () => import('react-syntax-highlighter/dist/esm/languages/prism/css'),
};
const PRISM_LANG_LOADED = new Set<string>();

function useSyntaxHighlighter(language?: string) {
  const [SyntaxHighlighter, setSyntaxHighlighter] = React.useState<any>(null);
  const [theme, setTheme] = React.useState<any>(null);
  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      const [{ default: PrismLight }, { default: prismTheme }] = await Promise.all([
        import('react-syntax-highlighter/dist/esm/prism-light'),
        import('react-syntax-highlighter/dist/esm/styles/prism/vsc-dark-plus'),
      ]);

      // Optionally load a specific language
      if (language) {
        const key = language.toLowerCase();
        if (!PRISM_LANG_LOADED.has(key) && PRISM_LANG_LOADERS[key]) {
          try {
            const loader = PRISM_LANG_LOADERS[key]!;
            const mod = await loader();
            PrismLight.registerLanguage(key, (mod as any).default || mod);
            PRISM_LANG_LOADED.add(key);
          } catch {
            // ignore missing language
          }
        }
      }

      if (!cancelled) {
        setSyntaxHighlighter(PrismLight);
        setTheme(prismTheme);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [language]);
  return { SyntaxHighlighter, theme } as { SyntaxHighlighter: any; theme: any };
}

export interface CodeBlockProps {
  code: string;
  language?: string;
  showLineNumbers?: boolean;
  fileName?: string;
  className?: string;
  'data-testid'?: string;
}

/**
 * CopyButton Component
 *
 * Button to copy code to clipboard with visual feedback.
 */
interface CopyButtonProps {
  code: string;
  className?: string;
}

const CopyButton: React.FC<CopyButtonProps> = ({ code, className }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy code:', err);
    }
  };

  return (
    <button
      onClick={handleCopy}
      className={cn(
        'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md',
        'bg-slate-700 hover:bg-slate-600',
        'text-slate-200 text-xs font-medium',
        'transition-colors duration-200',
        'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-slate-900',
        className
      )}
      aria-label={copied ? 'Copied!' : 'Copy code to clipboard'}
    >
      {copied ? (
        <>
          <CheckIcon className="w-4 h-4" aria-hidden="true" />
          <span>Copied!</span>
        </>
      ) : (
        <>
          <ClipboardDocumentIcon className="w-4 h-4" aria-hidden="true" />
          <span>Copy</span>
        </>
      )}
    </button>
  );
};

/**
 * CodeBlock Component
 *
 * Displays syntax-highlighted code with copy functionality.
 */
export const CodeBlock: React.FC<CodeBlockProps> = ({
  code,
  language = 'text',
  showLineNumbers = false,
  fileName,
  className,
  'data-testid': testId = 'code-block',
}) => {
  const { SyntaxHighlighter, theme } = useSyntaxHighlighter(language);

  return (
    <div
      className={cn('relative group rounded-lg overflow-hidden', className)}
      data-testid={testId}
    >
      {/* Header with filename and copy button */}
      <div className="flex items-center justify-between bg-slate-800 px-4 py-2 border-b border-slate-700">
        <div className="flex items-center gap-2">
          {fileName && <span className="text-slate-300 text-sm font-mono">{fileName}</span>}
          {!fileName && language && language !== 'text' && (
            <span className="text-slate-400 text-xs uppercase font-semibold tracking-wide">
              {language}
            </span>
          )}
        </div>

        <CopyButton code={code} />
      </div>

      {/* Code content */}
      <div className="relative">
        {SyntaxHighlighter ? (
          <SyntaxHighlighter
            language={language}
            style={theme}
            showLineNumbers={showLineNumbers}
            customStyle={{
              margin: 0,
              padding: '1rem',
              fontSize: '0.875rem',
              lineHeight: '1.5',
              background: '#1e1e1e',
            }}
            codeTagProps={{
              style: {
                fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
              },
            }}
          >
            {code}
          </SyntaxHighlighter>
        ) : (
          <pre className="m-0 p-4 text-[0.875rem] leading-6 bg-[#1e1e1e] text-slate-100 overflow-auto">
            <code>{code}</code>
          </pre>
        )}
      </div>
    </div>
  );
};

/**
 * InlineCode Component
 *
 * For inline code snippets (not full blocks).
 */
export interface InlineCodeProps {
  children: React.ReactNode;
  className?: string;
}

export const InlineCode: React.FC<InlineCodeProps> = ({ children, className }) => {
  return (
    <code
      className={cn(
        'px-1.5 py-0.5 rounded',
        'bg-muted text-primary',
        'text-sm font-mono',
        'border border-border',
        className
      )}
    >
      {children}
    </code>
  );
};

export default CodeBlock;
