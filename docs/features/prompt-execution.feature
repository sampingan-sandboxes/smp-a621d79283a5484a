Feature: Playbook prompt execution
  runPlaybookPrompt runs a Playbook's prompt against Claude with the user's connected tools,
  driving a bounded tool-use loop, and returns the final assistant text plus the tool calls
  it made. It stops on a non-tool_use turn, rejects hallucinated tool names locally, and
  degrades to a partial result at the iteration cap rather than looping forever.

  Scenario: The model stops immediately and returns its text with no tool calls
    Given the user has no active toolkits
    And the model replies "All done." and stops
    When the playbook prompt is run
    Then the run response is "All done."
    And no tools were executed

  Scenario: A declared tool is executed and the model then finishes
    Given the user has the "GMAIL_SEND_EMAIL" tool available
    And the model calls "GMAIL_SEND_EMAIL" then replies "Sent it." and stops
    And the tool returns data
    When the playbook prompt is run
    Then the run response is "Sent it."
    And one tool call was recorded for "GMAIL_SEND_EMAIL"
    And the model was called 2 times

  Scenario: A hallucinated tool name is rejected locally without calling Composio
    Given the user has the "GMAIL_SEND_EMAIL" tool available
    And the model calls "GMAIL_DELETE_EVERYTHING" then replies "done" and stops
    When the playbook prompt is run
    Then no tools were executed
    And one tool call was recorded whose output error names "GMAIL_DELETE_EVERYTHING"

  Scenario: The loop degrades to a partial result at the iteration cap
    Given the user has the "GMAIL_SEND_EMAIL" tool available
    And the model always requests the tool and never stops
    And the tool returns data
    When the playbook prompt is run
    Then the run response is ""
    And the model was called 8 times
    And 8 tool calls were recorded
