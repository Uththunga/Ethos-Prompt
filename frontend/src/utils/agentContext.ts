// Agent context detection utilities for Molē
// Determines whether we are in marketing or dashboard mode and derives page context keys.

export type AgentMode = 'marketing' | 'dashboard';

export function detectAgentMode(pathname: string): AgentMode {
  const path = pathname || '/';
  return path.startsWith('/dashboard') ? 'dashboard' : 'marketing';
}

export function getPageContext(pathname: string): string {
  const path = (pathname || '/').replace(/\/$/, '');
  if (path === '' || path === '/') return 'homepage';
  if (path.startsWith('/solutions')) return 'solutions_page';
  if (path.startsWith('/prompt-library')) return 'prompt_library_landing';
  if (path.startsWith('/services/')) return `service_${path.split('/')[2] || 'unknown'}`;
  if (path.startsWith('/guides')) return 'guides';
  if (path.startsWith('/faq')) return 'faq';
  if (path.startsWith('/help')) return 'marketing_help_center';
  if (path.startsWith('/auth') || path.startsWith('/login')) return 'auth_page';
  if (path.startsWith('/dashboard')) return 'dashboard_root';
  return 'marketing_other';
}

export function getAgentContext(pathname: string) {
  const mode = detectAgentMode(pathname);
  return {
    mode,
    pageContext: getPageContext(pathname),
  } as const;
}

