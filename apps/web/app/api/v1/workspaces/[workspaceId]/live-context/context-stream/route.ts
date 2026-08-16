/**
 * Alias for the Sprint 29 live-context chat stream.
 * Accepts `{ fullPageContext, activeHoverContext, userQuery }` (blueprint shape)
 * in addition to the workspace live-context payload.
 *
 * Prefer clients calling this or `.../live-context/chat` with Clerk session auth.
 */
export { OPTIONS, POST } from '../chat/route';
