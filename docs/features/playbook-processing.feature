Feature: Playbook processing orchestration
  processPlaybooksForTrigger matches the playbooks subscribed to an incoming trigger, creates a
  run record per playbook (in 'running' status before the gate even decides), then gates and
  executes each one independently — one playbook's failure never stops the others, and the
  persisted status reflects exactly which stage the playbook reached.

  Scenario: No run is created when nothing matches the trigger
    Given no playbook matches the trigger
    When the trigger is processed
    Then no run was created

  Scenario: A passing gate executes the playbook and completes the run
    Given a playbook "t1" matches the trigger
    And the gate passes with reasoning "looks urgent"
    And the executor returns response "Replied."
    When the trigger is processed
    Then the run "r1" was updated to status "completed"
    And the executor was run for playbook "t1"

  Scenario: A failing gate marks the run gated_out and skips execution
    Given a playbook "t1" matches the trigger
    And the gate does not pass with reasoning "not a match"
    When the trigger is processed
    Then the run "r1" was updated to status "gated_out"
    And the executor was not run

  Scenario: An execution failure marks the run failed
    Given a playbook "t1" matches the trigger
    And the gate passes with reasoning "looks urgent"
    And the executor throws
    When the trigger is processed
    Then the run "r1" was updated to status "failed"

  Scenario: One playbook's failure does not stop the others
    Given two playbooks "t1" and "t2" match the trigger
    And the first execution throws and the second succeeds
    When the trigger is processed
    Then the run "r1" was updated to status "failed"
    And the run "r2" was updated to status "completed"
