import type { IncomingTriggerPayload } from '@composio/core';
import { processPlaybooksForTrigger } from '../processor';

/**
 * YOUR TASK — implement the async worker handler. It is invoked asynchronously (never
 * behind API Gateway) by the connectors webhook's `invokePlaybookProcessorAsync`, so it can
 * safely run the full Claude + tool-use loop without racing an HTTP timeout.
 *
 * - Delegate the trigger `payload` straight to `processPlaybooksForTrigger(payload)`.
 * - Left to THROW on failure — Lambda automatically retries a failed async invocation,
 *   which is a genuine improvement over the synchronous path's swallow-and-log. So do not
 *   catch-and-swallow: rethrow (or simply let it propagate) if processing fails.
 */
export const handler = async (_payload: IncomingTriggerPayload): Promise<void> => {
  void processPlaybooksForTrigger;
  throw new Error('NotImplemented');
};
