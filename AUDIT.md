# Alex ACT Manager Audit

**Date**: 2026-08-06 \
**Branch**: `main` \
**Commit**: `a9a3ddc` \
**Scope**: Correctness, lifecycle safety, packaging, tests, security, and documentation
**Remediation update**: 2026-08-06; all reported source findings are resolved locally. Hosted CI evidence requires the next authorized push.

## Remediation Status

| Finding | Status | Evidence |
| --- | --- | --- |
| JSONC corruption and comment loss | Resolved | String-aware scanner plus URL, marker-string, and workspace-comment regressions |
| Six-plugin lifecycle drift | Resolved | Canonical `constellation-inventory.json` consumed by install, status, update, and uninstall contracts |
| Duplicate broad `.vscode` ignores | Resolved | All broad rules reconciled; `git check-ignore` regression passes |
| Payload accounting drift | Resolved | Delivery surface is `repository-at-release-tag`; only the real ceiling remains tested |
| Settings verification mismatch | Resolved | Read-only prompt delegates to deterministic `configure-vscode` preview |
| Conflicting update authority | Resolved | Exact Mall manifest resolver is authoritative; catalog is discovery-only |
| Conditional release assurance | Resolved in source | 26 local tests pass; CI checks out immutable Core `v1.0.0` and runs the same suite |
| Bootstrap and namespace documentation drift | Resolved | 16-file language and Manager-owned `plugin-status` route are contract-tested |

## Executive Summary

The project has a strong preview-and-consent design, a small dependency surface,
and a fast contract suite. However, it is **not ready for another release** until
two high-severity defects are resolved:

- The custom JSONC handling can silently corrupt unrelated settings and erase
  workspace comments.
- Constellation inventory drift makes install, status, update, uninstall, and
  reinstall behavior disagree about which plugins Manager owns.

This audit found **2 high**, **5 medium**, and **0 critical** issues. The current
contract suite passes, but it does not exercise the failing cases reproduced
below.

## Findings

### High: JSONC handling can corrupt user-owned settings

The trailing-comma cleanup in
[manager-operations.cjs](.github/skills/plugin-management/scripts/manager-operations.cjs#L121)
runs after string-aware scanning but is itself not string-aware. Valid string
content matching comma-plus-brace or comma-plus-bracket is modified before
parsing.

Additional problems share the same root cause:

- Comment detection uses a raw substring regex at
  [manager-operations.cjs](.github/skills/plugin-management/scripts/manager-operations.cjs#L154)
  and
  [manager-operations.cjs](.github/skills/plugin-management/scripts/manager-operations.cjs#L212).
  A normal value such as `https://example.com` is therefore classified as a
  comment.
- User settings fail closed when `hadComments` is true, but the workspace apply
  path at
  [manager-operations.cjs](.github/skills/plugin-management/scripts/manager-operations.cjs#L307)
  ignores that signal and rewrites comment-rich JSONC with `JSON.stringify`.

Reproduced in isolated temporary directories:

- A valid setting value of `",}"` became `"}"`; the command exited `0`.
- A workspace comment was removed; the command reported `hadComments: true`
  and still exited `0`.
- A comment-free settings file containing an HTTPS URL was rejected as
  comment-rich.

**Impact**: A consented configuration or workspace bootstrap can silently alter
unrelated user data, violating the documented preservation contract.

**Recommendation**: Replace the ad hoc parser/rewrite path with a structured,
comment-preserving JSONC edit API. Until then, fail closed on any workspace file
with comments. Add regression tests for strings containing `,}`, `,]`, `//`,
and `/*`, plus comment preservation in workspace settings.

### High: Plugin inventory drift breaks lifecycle completeness

Manager has six constellation plugins to account for: Manager, Core,
Illustrator, Document Tools, Enterprise, and MSFT. Several operational paths
still use the older four-plugin set.

Evidence:

- The install prompt omits Document Tools from its fallback order in
  [install-constellation.prompt.md](.github/prompts/install-constellation.prompt.md#L18).
- Install idempotency can declare completion using the stale four-or-three count
  in
  [install-constellation/SKILL.md](.github/skills/install-constellation/SKILL.md#L359).
- Status reports only four plugins in
  [plugin-status.prompt.md](.github/prompts/plugin-status.prompt.md#L27).
- Changelog review covers only four plugins in
  [update-plugins/SKILL.md](.github/skills/update-plugins/SKILL.md#L70).
- Full uninstall declares and removes only Core, Illustrator, Enterprise, and
  MSFT in
  [uninstall-constellation/SKILL.md](.github/skills/uninstall-constellation/SKILL.md#L3).
- Reinstall guidance installs Core and then invokes a Manager command without
  first installing Manager in
  [uninstall-constellation/SKILL.md](.github/skills/uninstall-constellation/SKILL.md#L187).

**Impact**: A fallback install can omit Document Tools; status can report a
false complete state; updates can skip Manager and Document Tools changelogs;
and a claimed full uninstall can leave both plugins installed and enabled.

**Recommendation**: Define one canonical constellation inventory and derive
install subsets, status, changelog checks, uninstall targets, and tests from it.
Treat Manager as preinstalled only during setup, not during status or teardown.

### Medium: `.gitignore` repair can leave managed files ignored

[manager-operations.cjs](.github/skills/plugin-management/scripts/manager-operations.cjs#L251)
uses `findIndex` and rewrites only the first broad `.vscode` rule. A later
matching rule still wins under Git ignore semantics.

Reproduced with both `.vscode/` and `/.vscode/` in one temporary repository:
after apply, `git check-ignore -v .vscode/settings.json` still matched the later
rule.

**Impact**: The command can report a successful narrowing while the two managed
files remain excluded from source control.

**Recommendation**: Reconcile every effective broad rule, then verify both files
with `git check-ignore` after apply. Fail verification when either remains
ignored.

### Medium: Distribution payload accounting is stale and unverified

[manifest.json](manifest.json#L100) declares `expected_payload_files: 36`.
The test suite separately asserts that constant at
[test-plugin-contract.cjs](scripts/test-plugin-contract.cjs#L53) and counts only
32 files in a narrower installable-source walk at
[test-plugin-contract.cjs](scripts/test-plugin-contract.cjs#L226).

The currently installed Manager tree contains 42 files, matching the 42 tracked
files in the checkout. No test compares the manifest value with either packaged
surface.

**Impact**: The release manifest can drift while tests stay green, so its payload
count provides no integrity signal.

**Recommendation**: Define the payload surface precisely and derive the manifest
count and test assertion from the same file walker or generated package list.

### Medium: Settings verification disagrees with apply semantics

The macOS/Linux verifier parses user settings with `JSON.parse` in
[configure-vscode-verify.prompt.md](.github/prompts/configure-vscode-verify.prompt.md#L54),
so ordinary JSONC comments or trailing commas can fail a read-only audit. It also
uses exact nested-object equality at
[configure-vscode-verify.prompt.md](.github/prompts/configure-vscode-verify.prompt.md#L58),
while the apply path intentionally preserves extra user-owned entries in nested
location maps.

**Impact**: Verification can fail on valid VS Code settings or report permitted
extensions to nested maps as policy drift.

**Recommendation**: Make verification invoke the deterministic preview path and
reuse its JSONC parser and deep-merge compliance semantics instead of maintaining
shell-specific comparators.

### Medium: Update version authority has two conflicting sources

The deterministic resolver uses the exact Mall manifest in
[manager-operations.cjs](.github/skills/plugin-management/scripts/manager-operations.cjs#L9).
The update skill instead directs agents to a weekly refreshed, flattened catalog
in
[update-plugins/SKILL.md](.github/skills/update-plugins/SKILL.md#L37), while the
install and status paths explicitly reject flattened discovery data as version
authority.

**Impact**: Update audits can disagree with install/status or miss a release
until the weekly catalog refreshes.

**Recommendation**: Route all Alex Mall version checks through
`marketplace-versions`; keep the catalog as discovery-only input.

### Medium: Release checks are conditional and do not cover observed failures

Cross-repository ownership and bootstrap parity checks are skipped when a sibling
Core checkout is absent in
[test-plugin-contract.cjs](scripts/test-plugin-contract.cjs#L56) and
[test-plugin-contract.cjs](scripts/test-plugin-contract.cjs#L84). The repository
also has no tracked CI workflow, so a standalone checkout can release without
those checks running.

The suite has no regression cases for JSON string integrity, workspace comment
preservation, duplicate broad `.vscode` ignore rules, canonical plugin inventory,
or actual packaged-file count.

**Impact**: The 20 passing tests overstate standalone release assurance.

**Recommendation**: Add CI that checks out or fetches the immutable approved Core
source, then add focused tests for every reproduced defect in this report.

## Documentation Drift

These lower-risk inconsistencies should be repaired with the inventory work:

- Repository instructions still say 17 bootstrap files in
  [.github/copilot-instructions.md](.github/copilot-instructions.md#L11) and
  [.github/copilot-instructions.md](.github/copilot-instructions.md#L21).
- The install skill still says “Seventeen only” in
  [install-constellation/SKILL.md](.github/skills/install-constellation/SKILL.md#L379).
- The greeting bootstrap references the retired Core namespace for
  `plugin-status` in
  [alex-act-greeting-checkin.instructions.md](.github/skills/install-constellation/bootstrap/alex-act-greeting-checkin.instructions.md#L216).

## Strengths

- Mutating lifecycle flows are designed around preview, explicit consent, and
  post-action verification.
- Runtime writes use sibling temporary files and rename on the paths reviewed.
- Marketplace record selection fails closed on missing, duplicate, or incomplete
  records.
- The package has no external runtime dependencies.
- No credential, private-key, token, or password patterns were found in tracked
  content.
- Component paths exist, local component links resolve, versions agree at
  `1.0.0`, and local Core bootstrap hashes matched during the test run.
- Public links route to Core rather than the private Steward repository.

## Verification Evidence

- `npm test`: **20 passed, 0 failed, 0 skipped**.
- Installed payload measurement: **42 files**.
- Tracked checkout measurement: **42 files**.
- Source worktree diff before this report: empty.
- Pre-existing untracked `.vscode/` content was not modified or treated as
  product source.
- Bluebird project/wiki indexing was unavailable because no ADO scope is
  configured for this GitHub repository; the audit used the live checkout and
  local Git history.

## Recommended Order

1. Replace or fail-close the JSONC write path and add corruption regressions.
2. Centralize the six-plugin constellation inventory and repair every lifecycle
   consumer.
3. Fix `.gitignore` verification and payload accounting.
4. Unify configure verification and update version authority with deterministic
   runtime paths.
5. Add CI and convert the reproduced probes into permanent tests.
6. Sweep the remaining 16-versus-17 and namespace documentation drift.
