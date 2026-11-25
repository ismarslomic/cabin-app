# Plan: <short title>

Status: **<One paragraph: state of the work, branch, commits, what is pushed (nothing / PR #n), and what a new agent does first.>**

Trigger: <what starts the feature or change>.
Input: <mockup, issue, spec; what is inspiration and what is binding>. <Constraints: theme, Framework7, icons, texts, README sections to follow.>

## Q&A

<Rules for this table. Delete this paragraph when the plan has no conflicting rows yet.> The Question column keeps the original question and the proposal made at the time; the Answer column is the decision and wins where they differ. A later row that changes an earlier one says so, and the earlier row gets "**Superseded in part by Qn:** ..." (or "Superseded by Qn") in the same step. Rows are numbered in the order they are decided and never renumbered; a follow-up uses `3b` or a new number that names the row it refines.

| #   | Status | Question                                                        | Answer                      |
| --- | ------ | --------------------------------------------------------------- | --------------------------- |
| 1   | Open   | **Topic.** The question, the options and the recommended option. | The decision (empty if Open). |

Status is `Open` or `Closed`. Ask the user the Open ones as short numbered questions; do not code on an Open row that the code depends on.

## Findings from the codebase and spec

Facts found by reading the code, the API spec or the docs (endpoints, request shapes, limits). Facts, not decisions.

## What is done

Branch `<branch>`, <n> commits ahead of `main`, each with `pnpm check` green. Pushed: <no / PR #n>. Tree: <clean / dirty>. <n> tests.

| Commit    | Content                      |
| --------- | ---------------------------- |
| `abc1234` | What the commit adds or fixes. |

Peer review rounds run and what was fixed (one line).

## Code map

What exists now, by folder. Update it when files move.

## What is left

1. The next step, concrete enough that a new agent can start.
2. Anything public (push, PR, release) is written "only when the user asks".

**Optional follow-ups** (ask first):
- ...

**Out of scope:** ...

## Working agreements for the next agent

Only what is specific to this plan: traps learned the hard way, the user's style for this work, components to reuse. Do not repeat CLAUDE.md or the README. Anything reusable beyond this plan goes into the README "Gotchas and decisions" chapter before the plan is closed.

## Findings worth keeping

Library and testing gotchas found while building. Move the reusable ones to the README at the end.

## Closing the plan

When the PR is merged, set Status to "Done, merged in #n" or delete the file, so an old plan does not mislead the next agent.
