// Provided acceptance suite — do not modify.
// Executes docs/features/blocknote-text.feature against your blocksToPlainText.
import { defineFeature, loadFeature } from 'jest-cucumber';
import { expect, beforeEach } from '@jest/globals';
import { blocksToPlainText } from '../src/components/playbook/blocknoteText';

const feature = loadFeature('docs/features/blocknote-text.feature');

// Named block-array fixtures the scenarios flatten (a Gherkin table can't carry nested
// BlockNote JSON, so each case is keyed here and selected by name in the step).
const PROMPTS: Record<string, unknown[]> = {
  empty: [],
  'plain-string': [{ type: 'paragraph', content: 'Hello world' }],
  'inline-text': [
    { type: 'paragraph', content: [{ type: 'text', text: 'Hello ' }, { type: 'text', text: 'world' }] },
  ],
  link: [
    {
      type: 'paragraph',
      content: [
        { type: 'text', text: 'See ' },
        { type: 'link', href: 'https://example.com/secret', content: [{ type: 'text', text: 'this page' }] },
      ],
    },
  ],
  nested: [
    {
      type: 'bulletListItem',
      content: 'Parent line',
      children: [
        { type: 'paragraph', content: 'Child line 1' },
        { type: 'paragraph', content: 'Child line 2' },
      ],
    },
  ],
  malformed: [
    null,
    42,
    'a raw string',
    { type: 'paragraph', content: [] },
    { type: 'paragraph', content: { weird: 'shape' } },
    { type: 'paragraph' },
    { type: 'paragraph', content: 'Visible' },
  ],
};

const ctx: { text: string } = { text: '' };

beforeEach(() => {
  ctx.text = '';
});

// ---- reusable step callbacks (each scenario wires the exact set below) ----
const flatten = (key: string) => {
  ctx.text = blocksToPlainText(PROMPTS[key]);
};
// A Gherkin literal can't hold a real newline, so `\n` in the expected value is unescaped.
const assertText = (expected: string) => {
  expect(ctx.text).toBe(expected.replace(/\\n/g, '\n'));
};
const assertNotContain = (needle: string) => {
  expect(ctx.text).not.toContain(needle);
};

const FLATTEN = /^the "([^"]*)" prompt is flattened$/;
const TEXT_IS = /^the flattened text is "([^"]*)"$/;
const NOT_CONTAIN = /^the flattened text does not contain "([^"]*)"$/;

defineFeature(feature, (test) => {
  test('An empty prompt flattens to an empty string', ({ when, then }) => {
    when(FLATTEN, flatten);
    then(TEXT_IS, assertText);
  });

  test('A plain-string paragraph yields its text', ({ when, then }) => {
    when(FLATTEN, flatten);
    then(TEXT_IS, assertText);
  });

  test('Inline text items are concatenated', ({ when, then }) => {
    when(FLATTEN, flatten);
    then(TEXT_IS, assertText);
  });

  test('A link contributes its visible text but never its href', ({ when, then, and }) => {
    when(FLATTEN, flatten);
    then(TEXT_IS, assertText);
    and(NOT_CONTAIN, assertNotContain);
  });

  test('Nested children are newline-joined under the parent', ({ when, then }) => {
    when(FLATTEN, flatten);
    then(TEXT_IS, assertText);
  });

  test('Empty and malformed blocks contribute nothing', ({ when, then }) => {
    when(FLATTEN, flatten);
    then(TEXT_IS, assertText);
  });
});
