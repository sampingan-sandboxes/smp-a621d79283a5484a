Feature: Run store and trigger resolution
  The playbook-run repository persists and scopes run records, and the trigger library
  searches a user's connected trigger types and re-resolves a playbook's denormalized toolkit
  name/logo against the live catalog.

  Scenario: A new run is created in running status with a generated id
    Given a run input for playbook "playbook-1"
    When the run is created
    Then the created run has status "running"
    And the created run has an empty tool-call list
    And the created run was persisted to "playbook_runs"

  Scenario: Fetching a run scopes the query to the caller and strips the Mongo _id
    Given a stored run "run-1" exists for the caller
    When the run "run-1" is fetched for user "user-1"
    Then the fetched run id is "run-1"
    And the fetched run has no "_id" field
    And the run was queried by user and id

  Scenario: Searching triggers returns nothing without active connections
    Given the user has no active connections
    When triggers are searched for ""
    Then the trigger search returns no results
    And the trigger cache was not consulted

  Scenario: Searching triggers filters the cached triggers by query
    Given the user has an active "gmail" connection
    And the cache holds a "new_email" and a "new_attachment" trigger
    When triggers are searched for "attach"
    Then the trigger search returns slugs "new_attachment"

  Scenario: Resolving a trigger overrides a stale toolkit name from the catalog
    Given the catalog names "notion" as "Notion"
    When the trigger for toolkit "notion" with stale name "notion" is resolved
    Then the resolved trigger toolkitName is "Notion"

  Scenario: Resolving a null trigger passes it through untouched
    When a null trigger is resolved
    Then the resolved trigger is null
    And the catalog was not fetched
