import Anthropic from '@anthropic-ai/sdk';

/**
 * YOUR TASK — implement this module.
 *
 * Returns a lazily-constructed, process-cached `Anthropic` client built from
 * `process.env.ANTHROPIC_API_KEY`. The client holds no per-request state, so it must be
 * created once and reused across invocations (construct with `new Anthropic({ apiKey })`
 * on first call, then return the same instance on every later call).
 */
export function getAnthropicClient(): Anthropic {
  // Keeps the value import valid until you implement with `new Anthropic({ apiKey: ... })`.
  void Anthropic;
  throw new Error('NotImplemented');
}
