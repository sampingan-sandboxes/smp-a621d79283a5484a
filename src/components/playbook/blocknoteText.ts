// BlockNote (@blocknote/core) is a frontend-only dependency — this backend has no package
// for it, so a Playbook's `prompt` field (BlockNote's block-array JSON, stored as
// `unknown[]`) must be walked with structural, unknown-safe narrowing instead of typed
// `Block` imports. This is intentionally a minimal extractor, not a markdown renderer: it
// exists to hand Claude readable plain-text instructions, not to preserve formatting.
//
// The `InlineTextContent`, `InlineLinkContent`, and `BlockLike` shapes are declared in
// `../../interfaces/playbook` for you to narrow against.

/**
 * YOUR TASK — implement `blocksToPlainText`: flatten a BlockNote block array into plain
 * text. It must be a PURE function (no I/O). Rules:
 *
 * - A block's visible text comes from its `content` field: a plain string is used as-is;
 *   an array of inline-content items is mapped to their visible text and joined with '';
 *   any other shape (missing / object / etc.) contributes ''.
 * - An inline item of `{ type: 'text', text }` contributes its `text`. An inline item of
 *   `{ type: 'link', content: [...] }` contributes the joined visible text of its nested
 *   content (NEVER its href). Any other inline shape contributes ''.
 * - A block also recurses into its `children` blocks; each child's text is appended on its
 *   own line (newline-joined with the parent).
 * - Blocks (and children) that produce no text are dropped, not emitted as blank lines.
 * - Non-object entries in the top-level array (null, numbers, strings, …) contribute ''.
 * - An empty block array returns ''.
 */
export function blocksToPlainText(_blocks: unknown[]): string {
  throw new Error('NotImplemented');
}
