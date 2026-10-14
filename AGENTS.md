# Agent instructions

## Git history

Before implementation and after connector-created commits, synchronize with the intended remote branch using [history guidance](docs/development/validation.md#synchronize-history-before-implementation) and [connector-commit guidance](docs/development/validation.md#after-connector-created-commits).

## Issue tracker

Issues and specifications live in GitHub Issues. Use `gh` when available, or the connected GitHub tools if it is unavailable. See [issue-tracker guidance](docs/agents/issue-tracker.md).

## Triage labels

Use the default labels `needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, and `wontfix`. See [triage-label guidance](docs/agents/triage-labels.md).

## Domain docs

This is a single-context repository with a root `GLOSSARY.md` and `docs/adr/`. Read the glossary and relevant decisions before changing domain language or behavior. See [domain guidance](docs/agents/domain.md).

## Dependencies and publishing

Run the workstation preflight before exploration, check dependencies in the intended checkout before build or preview work, and follow the validation and merge-readiness steps in [development guidance](docs/development/validation.md#project-dependency-readiness) and [merge readiness](docs/development/validation.md#merge-readiness). Readiness labels do not authorize publishing or merging.

Keep tool discovery and file inspection bounded; see [bounded tool discovery](docs/development/validation.md#bounded-tool-discovery) and [generated report searching](docs/development/validation.md#searching-generated-reports).
