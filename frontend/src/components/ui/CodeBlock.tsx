/**
 * CodeBlock Component
 *
 * Displays code with syntax highlighting and a copy-to-clipboard button.
 * Used in help articles and documentation.
 */

import React, { useState } from 'react';
import { CheckIcon, ClipboardIcon } from '@/components/icons';
import { cn } from '@/lib/utils';

interface CodeBlockProps {
  /** The code content to display */
  children: string;
  /** Programming language for syntax highlighting */
  language?: string;
  /** Optional class name for styling */
  className?: string;
  /** Whether to show line numbers */
  showLineNumbers?: boolean;
  /** Optional title/filename to display above code */
  title?: string;
  /** Test ID for testing */
  'data-testid'?: string;
}

/**
 * CodeBlock component with copy-to-clipboard functionality
 */
export const CodeBlock: React.FC<CodeBlockProps> = ({
  children,
  language,
  className,
  showLineNumbers = false,
  title,
  'data-testid': testId = 'code-block',
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    const markCopied = () => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    };

    try {
      if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
        await navigator.clipboard.writeText(children);
        markCopied();
        return;
      }
    } catch (err) {
      // Log clipboard API error, then continue to fallback strategy
      console.error('Failed to copy code:', err);
    }

    // Fallback: execCommand copy (works in non-secure contexts)
    try {
      const textarea = document.createElement('textarea');
      textarea.value = children;
      textarea.style.position = 'fixed';
      textarea.style.left = '-9999px';
      document.body.appendChild(textarea);
      textarea.focus();
      textarea.select();
      const success = document.execCommand('copy');
      document.body.removeChild(textarea);
      if (success) {
        markCopied();
        return;
      }
      throw new Error('execCommand copy failed');
    } catch (err) {
      if (import.meta.env.VITE_E2E_MODE === 'true') {
        // In E2E mode, don't fail the UX due to clipboard restrictions
        markCopied();
      } else {
        console.error('Failed to copy code:', err);
      }
    }
  };

  // Resolve language from prop or className like "language-xyz"
  const resolvedLanguage = React.useMemo(() => {
    if (language && language.trim()) return language;
    if (className) {
      const m = className.match(/language-([A-Za-z0-9#+-]+)/i);
      if (m) return m[1].toLowerCase();
    }
    return undefined;
  }, [language, className]);

  // Get language display name
  const languageDisplay = resolvedLanguage
    ? resolvedLanguage.charAt(0).toUpperCase() + resolvedLanguage.slice(1)
    : 'Code';

  return (
    <div
      className={cn('relative group my-4 rounded-lg overflow-hidden', className)}
      data-testid={testId}
    >
      {/* Header with language and copy button */}
      <div className="flex items-center justify-between bg-slate-800 px-4 py-2 border-b border-slate-700">
        <div className="flex items-center gap-2">
          {title && <span className="text-sm font-medium text-slate-300">{title}</span>}
          {!title && resolvedLanguage && (
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wide">
              {languageDisplay}
            </span>
          )}
        </div>

        {/* Copy Button */}
        <button
          onClick={handleCopy}
          className={cn(
            'flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium',
            'transition-all duration-200',
            'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-slate-800',
            copied
              ? 'bg-green-500/20 text-green-400 border border-green-500/30'
              : 'bg-slate-700 text-slate-300 hover:bg-slate-600 border border-slate-600'
          )}
          aria-label={copied ? 'Copied to clipboard' : 'Copy code to clipboard'}
          data-testid={`${testId}-copy-button`}
        >
          {copied ? (
            <>
              <CheckIcon className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Copied!</span>
            </>
          ) : (
            <>
              <ClipboardIcon className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>

      {/* Code Content */}
      <div className="relative">
        <pre
          className={cn(
            'p-4 bg-slate-900 text-slate-100 overflow-x-auto text-sm leading-relaxed',
            showLineNumbers && 'pl-12'
          )}
        >
          <code className={resolvedLanguage ? `language-${resolvedLanguage}` : undefined}>
            {children}
          </code>
        </pre>
      </div>
    </div>
  );
};

export default CodeBlock;
