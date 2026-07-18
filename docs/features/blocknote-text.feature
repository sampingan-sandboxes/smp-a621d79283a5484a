Feature: BlockNote prompt flattening
  blocksToPlainText turns a Playbook's BlockNote block-array prompt into the plain text
  handed to Claude: visible text only, links without their href, children newline-joined,
  and empty/malformed blocks dropped.

  Scenario: An empty prompt flattens to an empty string
    When the "empty" prompt is flattened
    Then the flattened text is ""

  Scenario: A plain-string paragraph yields its text
    When the "plain-string" prompt is flattened
    Then the flattened text is "Hello world"

  Scenario: Inline text items are concatenated
    When the "inline-text" prompt is flattened
    Then the flattened text is "Hello world"

  Scenario: A link contributes its visible text but never its href
    When the "link" prompt is flattened
    Then the flattened text is "See this page"
    And the flattened text does not contain "example.com"

  Scenario: Nested children are newline-joined under the parent
    When the "nested" prompt is flattened
    Then the flattened text is "Parent line\nChild line 1\nChild line 2"

  Scenario: Empty and malformed blocks contribute nothing
    When the "malformed" prompt is flattened
    Then the flattened text is "Visible"
