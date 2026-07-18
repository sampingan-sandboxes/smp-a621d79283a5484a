import { LambdaClient, InvokeCommand } from '@aws-sdk/client-lambda';
import type { IncomingTriggerPayload } from '@composio/core';

/**
 * YOUR TASK — implement `invokePlaybookProcessorAsync`.
 *
 * Fire the (potentially multi-minute, multi-Claude-call) playbook run on a separate,
 * long-timeout Lambda instead of running it inline behind the webhook's HTTP response.
 *
 * - Read the target function name from `process.env.PLAYBOOK_PROCESSOR_FUNCTION_NAME`; if it
 *   is unset, throw `new Error('PLAYBOOK_PROCESSOR_FUNCTION_NAME is not set')` WITHOUT invoking.
 * - Otherwise send an `InvokeCommand` via a (cached) `LambdaClient` with
 *   `InvocationType: 'Event'` (async — returns as soon as AWS accepts it) and the payload
 *   JSON-serialized into a `Buffer`.
 */
export async function invokePlaybookProcessorAsync(_payload: IncomingTriggerPayload): Promise<void> {
  void LambdaClient;
  void InvokeCommand;
  throw new Error('NotImplemented');
}
