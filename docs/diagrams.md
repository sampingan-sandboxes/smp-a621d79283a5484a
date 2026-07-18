# Diagrams — Playbook Module

## Pipeline overview (webhook → run outcome)

```mermaid
flowchart TD
    W[Composio webhook\n（connectors module）] --> INV[invokePlaybookProcessorAsync\nInvocationType: Event]
    INV --> WK[playbookProcessorWorker\nasync Lambda, 120s]
    WK --> P[processPlaybooksForTrigger]
    P --> M[findPlaybooksByTrigger]
    M -->|no match| DONE[done]
    M -->|per matched playbook| CR[createRun → running]
    CR --> G{evaluateTriggerGate}
    G -->|not passed| GO[updateRun → gated_out]
    G -->|passed| RG[updateRun → gateReasoning]
    RG --> EX[runPlaybookPrompt]
    EX -->|ok| CP[updateRun → completed]
    EX -->|throws| FA[updateRun → failed]
    G -->|throws| FA
    CR -->|throws| SKIP[skip this playbook,\ncontinue others]
```

## Gate — bounded investigative loop (sequence)

```mermaid
sequenceDiagram
    autonumber
    participant P as processor
    participant Gate as evaluateTriggerGate
    participant Tools as tools/composio
    participant Claude as Anthropic (Haiku)

    P->>Gate: (userId, triggerDescription, payload)
    alt description empty/whitespace
        Gate-->>P: { passed: true, reasoning: "…always matching." }
    else has description
        Gate->>Tools: getActiveToolkitSlugs → filter to payload.toolkitSlug
        Gate->>Tools: getAnthropicToolsForToolkits(...) + submit_gate_decision
        loop until decision or budget exhausted (max 4 real calls / 12 passes)
            Gate->>Claude: messages.create(tool_choice: any)
            alt submit_gate_decision
                Claude-->>Gate: { matches, reasoning }
                Gate-->>P: { passed: matches, reasoning }
            else investigative tool_use
                Gate->>Tools: execute(name, {userId, arguments})
                Note over Gate: hallucinated / not-found names answered locally,\nbudget NOT consumed; real results/errors consume it
                Tools-->>Gate: tool_result (fed back)
            end
        end
        Gate-->>P: fail closed: { passed: false, reasoning: "Could not confirm…" }
    end
```

## Executor — prompt tool-use loop (sequence)

```mermaid
sequenceDiagram
    autonumber
    participant P as processor
    participant Ex as runPlaybookPrompt
    participant Tools as tools/composio
    participant Claude as Anthropic (playbook.model)

    P->>Ex: (playbook, payload)
    Ex->>Tools: getActiveToolkitSlugs → getAnthropicToolsForToolkits
    Ex->>Ex: blocksToPlainText(playbook.prompt) + trigger context
    loop up to 8 iterations
        Ex->>Claude: messages.create({ model, messages, tools })
        alt stop_reason != tool_use
            Claude-->>Ex: text
            Ex-->>P: { response, toolCalls }
        else tool_use
            Ex->>Tools: execute(name, {...})  %% hallucinated name → local error, no call
            Tools-->>Ex: output → record { name, input, output }, feed tool_result back
        end
    end
    Ex-->>P: iteration cap → { response: "", toolCalls } (partial)
```

## Processor — per-playbook swimlane

```mermaid
sequenceDiagram
    autonumber
    participant WK as worker
    participant Proc as processPlaybooksForTrigger
    participant Repo as playbook-config/repo
    participant Runs as runsRepo
    participant Gate as gate
    participant Ex as executor

    WK->>Proc: payload
    Proc->>Repo: findPlaybooksByTrigger(userId, triggerSlug)
    Repo-->>Proc: [playbook…]
    loop each matched playbook (independent)
        Proc->>Runs: createRun(...) → running
        alt createRun throws
            Note over Proc: log + skip this playbook, continue others
        else run created
            Proc->>Gate: evaluateTriggerGate(...)
            alt gate not passed
                Proc->>Runs: updateRun(gated_out)
            else gate passed
                Proc->>Runs: updateRun(gateReasoning)
                Proc->>Ex: runPlaybookPrompt(playbook, payload)
                alt execute ok
                    Proc->>Runs: updateRun(completed, response, toolCalls)
                else execute throws
                    Proc->>Runs: updateRun(failed, error)
                end
            else gate throws
                Proc->>Runs: updateRun(failed, error)  %% swallow a further failure
            end
        end
    end
```
