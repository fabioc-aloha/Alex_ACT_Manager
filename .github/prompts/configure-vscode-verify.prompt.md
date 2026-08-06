---
description: "Read-only audit of user-level VS Code/Copilot settings compliance"
lastReviewed: 2026-06-30
---

# Configure VS Code — Verify

Use this to verify fleet policy compliance on a machine without changing any settings.

This prompt is self-contained. If the generic skill tool is unavailable, continue with the read-only steps; do not report Manager as missing.

This prompt audits user-scope settings only. Review workspace settings directly from the current repository.

## Objective

Audit user-scope VS Code settings against the central baseline and report drift.

## Source of truth

The baseline lives at `<plugin-management-skill>/resources/welcome-baseline.json` (`settings` object). Resolve the installed Manager skill path first. Both `/alex-act-manager configure-vscode` (apply) and `/alex-act-manager configure-vscode-verify` (this audit) load from the same file.

## Read-Only Steps

1. Resolve `<plugin-management-skill>/scripts/manager-operations.cjs` from the installed Manager tree.
2. Run its `configure-vscode` command without `--apply`. The command resolves the OS-specific user settings path, parses JSONC with string-aware comment and trailing-comma handling, and applies the same deep-merge compliance semantics as the write path.
3. Read the returned JSON plan. `compliant` lists current keys; `changes` lists missing or drifted values; `unsupportedLocalMarkdownStyles` reports local absolute CSS paths separately.
4. Report compliance summary and the change table.
5. Recommend running `/alex-act-manager configure-vscode` only if changes are present.

## Reference Command

```text
node "<plugin-management-skill>/scripts/manager-operations.cjs" configure-vscode
```

Without `--apply`, this command is read-only and never writes to `settings.json`.

If user settings contain an absolute local path in `markdown.styles`, report it as unsupported guidance. Recommend an HTTPS stylesheet for user scope or `/alex-act-manager bootstrap-workspace` for workspace-relative local CSS.

## Output Format

```text
Compliance: <X>/<N> keys
Drift: <count>
Missing: <count>

Drifted keys:
- key: expected=<...>, actual=<...>

Missing keys:
- key: expected=<...>

Recommendation:
- No action required | Run `/alex-act-manager configure-vscode` to apply baseline
```

## Guardrails

- Do not modify files.
- User-scope only (never evaluate workspace `.vscode/settings.json` for policy compliance).
- Treat unknown extra keys as informational only, not non-compliance.

## Would Revise If

Revisit this prompt by **2026-08-26** (90 days) or sooner if any of the following fires: the workflow it invokes ceases to produce its intended output (skill body changed but prompt steps stale); the visible markers / verification steps in its body are consistently skipped; or the slash-command name is no longer discoverable in the prompt picker.
