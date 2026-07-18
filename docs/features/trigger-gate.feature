Feature: Trigger gate evaluation
  evaluateTriggerGate is a cheap pre-filter that decides whether an incoming trigger event
  matches the user's stated criteria before the executor runs. It short-circuits an empty
  description, drives a bounded Claude tool-use loop, and fails closed when it runs out of
  investigative budget.

  Scenario: An empty description is treated as always matching without calling the model
    Given the trigger description is empty
    When the gate is evaluated
    Then the gate passes
    And the gate reasoning is "No trigger description set — treated as always matching."
    And the Anthropic model was not called

  Scenario: The model submits a match on the first turn
    Given the active toolkits are "SLACK"
    And the gate model will submit matches "true" with reasoning "This is from the named user."
    When the gate is evaluated with description "messages from Jane"
    Then the gate passes
    And the gate reasoning is "This is from the named user."
    And the Anthropic model was called 1 time

  Scenario: The model submits a non-match
    Given the active toolkits are "SLACK"
    And the gate model will submit matches "false" with reasoning "Different person."
    When the gate is evaluated with description "messages from Jane"
    Then the gate does not pass
    And the gate reasoning is "Different person."

  Scenario: One investigative tool round precedes the decision
    Given the active toolkits are "SLACK"
    And an investigative tool "SLACK_GET_USER_INFO" is available
    And the gate model calls "SLACK_GET_USER_INFO" then submits matches "true" with reasoning "Confirmed via lookup."
    And the tool returns data
    When the gate is evaluated with description "messages from Jane"
    Then the gate passes
    And the tool was executed once
    And the Anthropic model was called 2 times

  Scenario: The gate fails closed when the investigation budget is exhausted
    Given the active toolkits are "SLACK"
    And an investigative tool "SLACK_GET_USER_INFO" is available
    And the gate model keeps calling "SLACK_GET_USER_INFO" without ever deciding
    And the tool returns data
    When the gate is evaluated with description "messages from Jane"
    Then the gate does not pass
    And the gate reasoning is "Could not confirm the match within 4 investigative tool call(s)."
    And the Anthropic model was called 4 times
