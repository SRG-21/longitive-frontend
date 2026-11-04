/**
 * The in-app path to return to after signing in (`?next=`), or `/`. Only same-origin paths are
 * accepted — never a full URL or a protocol-relative `//host` — so the parameter can't be used
 * to send someone to another site after they log in.
 */
export function safeNextPath(next: string | null | undefined): string {
  if (!next || !next.startsWith('/') || next.startsWith('//') || next.startsWith('/\\')) return '/'
  return next
}

/** The sign-in page, remembering where the user was headed. */
export function loginPathFor(location: { pathname: string; search: string }): string {
  return `/login?next=${encodeURIComponent(location.pathname + location.search)}`
}
