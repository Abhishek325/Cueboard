# Slateory: a board you and your agent can use

Positioning proposal — 28 October 2026. This is a product hypothesis and copy for review, not a validated demand or growth claim.

## The useful job

A creator discusses ideas with an agent, but needs the decisions, next action and real progress somewhere visible. The agent maintains the relevant cards during authorized sessions. The creator can inspect, correct and continue the work without searching a chat history.

The board stays useful without an agent. No built-in model is required for this positioning.

## Copy we can use now

**Slateory — a simple board for your ideas and next steps.**

Bring your own browser-capable agent to help keep it current. Group ideas by theme, see what is underway, and keep finished work in view. The agent needs access to the browser profile containing your board; there is no dedicated agent connector or cloud sync.

Use this as a secondary workflow first. The current fields and formats are designed for creators, so a broad claim about managing any agent's tasks would overstate the product's fit.

## Stronger positioning to test

**One board. Clear to you and your agent.**

**Your agent keeps the plan current. You stay in the picture.**

These are candidate messages. The second requires a demonstrated, reliable update workflow; it must not imply that Slateory runs an agent or updates in the background.

## Differentiation

Notion already offers agent read/write access through [Notion MCP](https://www.notion.com/help/notion-mcp). Agent compatibility alone is not a unique market position.

Slateory's proposed angle is a small, focused creator board: themes, concrete demonstrations, viewer value and progress, with no Slateory account required for planning. Whether this is enough to attract repeat users remains to be tested.

## Small next additions, before a large integration

| Priority | Proposed addition | What it would solve | Current status |
| --- | --- | --- | --- |
| 1 | Copy agent instructions for the selected project | Gives the agent the actual project, permitted actions and field meanings. | Implemented: project-specific panel, permission scope, task and clipboard fallback. |
| 2 | Copy a readable board brief with stable card IDs | Shares selected context without sending a whole conversation. Requires deliberate selection and excludes connection credentials. | Implemented within the instructions panel: optional selected cards with stable IDs; no connection settings. |
| 3 | Preview and apply incremental card updates | Lets an agent return specific changes, detects stale edits and avoids whole-board replacement. | Not implemented. |
| Later | A scoped local bridge or authenticated API/MCP connector | Supports direct agents that cannot operate the user's browser. Requires a real storage/access design. | Not implemented. |

Markdown alone is an export format, not a live integration. A hosted connector cannot automatically access a visitor's browser-local IndexedDB. Do not promise cross-device access or zero setup until those paths exist and are tested.

## Demonstration and validation

Record one real workflow with fictional content: ask the agent to add an agreed idea, explain its viewer value, update the next action, then continue the same card in a later session. Show the board before and after, including the owner correcting a detail.

Before making stronger claims, check whether agents can:

- Find the right project and existing card without creating duplicates.
- Preserve the owner's notes while changing the requested fields.
- Save and verify the correct status without treating a draft as published work.
- Resume in the right browser profile and clearly report unavailable access.

Record task success, time, corrections, wrong-project edits and duplicates. Separately ask whether creators actually return to the board. A successful demo does not establish market demand, retention or support for every agent.
