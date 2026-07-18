import type Anthropic from '@anthropic-ai/sdk';
import { getComposioClient } from '../connectors/composioClient';
import { listConnections } from '../connectors/connectorsRepo';

/**
 * YOUR TASK — implement `getActiveToolkitSlugs`.
 *
 * Load the user's connections via `listConnections(userId)` and return the `toolkit` slug
 * of every connection whose `status` is 'ACTIVE' (drop all others), preserving order.
 */
export async function getActiveToolkitSlugs(_userId: string): Promise<string[]> {
  void listConnections;
  throw new Error('NotImplemented');
}

/**
 * YOUR TASK — implement `getAnthropicToolsForToolkits`.
 *
 * Given a list of toolkit slugs, return the Anthropic tool declarations for them:
 * - An empty slug list returns `[]` WITHOUT calling Composio.
 * - Otherwise fetch `getComposioClient().tools.getRawComposioTools({ toolkits })` and map
 *   each raw Composio tool (`@composio/core`'s `Tool`) to an `Anthropic.Tool`:
 *   `{ name: tool.slug, description: tool.description ?? '',
 *      input_schema: (tool.inputParameters ?? { type: 'object', properties: {} }) }`.
 */
export async function getAnthropicToolsForToolkits(_toolkitSlugs: string[]): Promise<Anthropic.Tool[]> {
  void getComposioClient;
  throw new Error('NotImplemented');
}
