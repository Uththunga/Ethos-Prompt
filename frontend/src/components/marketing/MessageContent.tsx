/**
 * MessageContent - Renders Markdown content safely
 *
 * Security features:
 * - Whitelisted elements only (no script, iframe, object, embed)
 * - Syntax highlighting for code blocks
 * - GitHub Flavored Markdown support (tables, strikethrough, task lists)
 *
 * Co-browsing features:
 * - Internal links navigate in same tab with side-panel mode
 * - External links open in new tab (security)
 */
import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import type { Components } from 'react-markdown';
import { useMarketingChat } from '@/contexts/MarketingChatContext';

interface MessageContentProps {
  content: string;
  className?: string;
}

/**
 * Determines if a URL is internal (same domain/origin)
 * Internal links will navigate in the same tab with side-panel mode
 */
function isInternalLink(href: string | undefined): boolean {
  if (!href) return false;

  // Relative paths are internal
  if (href.startsWith('/') && !href.startsWith('//')) return true;

  // Hash-only links (anchor links) are internal
  if (href.startsWith('#')) return true;

  // Check if same origin
  try {
    const url = new URL(href, window.location.origin);
    return url.origin === window.location.origin;
  } catch {
    // Invalid URL - treat as external for safety
    return false;
  }
}

export const MessageContent = React.memo(function MessageContent({
  content,
  className = '',
}: MessageContentProps) {
  const { navigateWithChat } = useMarketingChat();

  const components: Components = {
    // Inline and block code handling
    code: ({ node, className: codeClassName, children, ...props }) => {
      // Check if it's a code block (has language class) or inline code
      const isCodeBlock = codeClassName?.startsWith('language-');

      if (!isCodeBlock) {
        return (
          <code className="inline-code" {...props}>
            {children}
          </code>
        );
      }
      // Block code with syntax highlighting
      return (
        <code className={codeClassName} {...props}>
          {children}
        </code>
      );
    },
    // Wrap pre for block code styling
    pre: ({ node, children, ...props }) => (
      <div className="code-block-wrapper">
        <pre className="code-block" {...props}>
          {children}
        </pre>
      </div>
    ),
    // Enhanced link handling: internal links navigate in same tab
    a: ({ node, children, href, ...props }) => {
      const isInternal = isInternalLink(href);

      if (isInternal && href) {
        return (
          <a
            href={href}
            onClick={(e) => {
              e.preventDefault();
              navigateWithChat(href);
            }}
            className="markdown-link internal-link"
            {...props}
          >
            {children}
          </a>
        );
      }

      // External link - open in new tab for security
      return (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="markdown-link external-link"
          {...props}
        >
          {children}
        </a>
      );
    },
  };

  return (
    <div className={`markdown-content ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeHighlight]}
        components={components}
        disallowedElements={['script', 'iframe', 'object', 'embed', 'style']}
        unwrapDisallowed={true}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
});
