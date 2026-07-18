Feature: Run history and trigger-search HTTP API
  The read endpoints authenticate the caller, scope every lookup to them, and guard each
  step with the right status codes: GET /triggers searches connected trigger types, and
  GET /playbooks/{id}/runs[/{runId}] serves a playbook's run history.

  Scenario: Searching triggers requires authentication
    Given the caller is not authenticated
    When triggers are searched with term "gmail"
    Then the response status is 401

  Scenario: Searching triggers returns the resolved triggers
    Given the caller is authenticated as "user-123"
    And the trigger search yields a "GMAIL_NEW_GMAIL_MESSAGE" trigger
    When triggers are searched with term "gmail"
    Then the response status is 200
    And the response body lists 1 trigger

  Scenario: A trigger-search failure is surfaced as 502
    Given the caller is authenticated as "user-123"
    And the trigger search fails
    When triggers are searched with term "gmail"
    Then the response status is 502
    And the response message is "Failed to search triggers"

  Scenario: Listing runs returns 404 for an unknown playbook
    Given the caller is authenticated as "user-123"
    And the playbook does not exist
    When runs are listed for playbook "missing"
    Then the response status is 404
    And the response message is "Not found"

  Scenario: Listing runs returns the playbook's runs
    Given the caller is authenticated as "user-123"
    And the playbook "playbook-1" exists
    And the playbook has 2 stored runs
    When runs are listed for playbook "playbook-1"
    Then the response status is 200
    And the response body lists 2 runs

  Scenario: Fetching a run that belongs to another playbook returns 404
    Given the caller is authenticated as "user-123"
    And the playbook "playbook-1" exists
    And the run "run-1" belongs to playbook "some-other-playbook"
    When run "run-1" is fetched for playbook "playbook-1"
    Then the response status is 404
    And the response message is "Not found"

  Scenario: Fetching a run that belongs to the playbook returns it
    Given the caller is authenticated as "user-123"
    And the playbook "playbook-1" exists
    And the run "run-1" belongs to playbook "playbook-1"
    When run "run-1" is fetched for playbook "playbook-1"
    Then the response status is 200
    And the response body has run id "run-1"
