# Changelog

All notable changes to Alex ACT Manager will be documented in this file.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project uses [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.0.1] - 2026-08-06

### Fixed

- Made instruction-bootstrap idempotency require exact source, destination, and
  receipt hash parity even when the Core version is unchanged. New receipts
  record a per-file SHA-256 map; legacy receipts remain readable and are
  verified against the bundled source before repair decisions.
- Made JSONC parsing string-aware for comments and trailing commas, and made
  workspace bootstrap fail closed before writing comment-rich settings.
- Centralized the six-plugin lifecycle inventory and reconciled install,
  status, update, uninstall, and reinstall guidance, including Document Tools
  and Manager ownership.
- Reconciled every broad `.vscode` ignore rule instead of only the first.
- Routed settings verification and Alex Mall version checks through Manager's
  deterministic runtime, removed stale exact payload counts, and corrected the
  greeting status namespace in Core source and the bootstrap mirror.
- Added focused regressions and standalone CI against immutable Core commit
  `4d4439b`.

### Changed

- README: the 100-file figure is now stated as this constellation's own
  packaging convention rather than an observed Copilot CLI Windows ceiling. No
  install-time check enforces it, and a 133-file install succeeded on Copilot
  CLI 1.0.78. The Core/Manager split is re-argued on maintenance-cadence
  grounds, which is the reason that survives the correction.

### Removed

- `plugin-management`: dropped the `ai-memory-setup` cross-reference. That skill
  was removed from the baseline by ADR-020, so the bullet pointed at nothing.

## [1.0.0] - 2026-08-06

### Changed

- Became the sole source owner for `bootstrap-workspace`,
  `install-constellation`, `plugin-management`, `uninstall-constellation`, and
  `update-plugins`; Core retains namespaced command redirects only.
- Reduced the default instruction bootstrap from 17 files to 16 and removed
  Shared Memory routing from the Manager payload.
- Narrowed the bootstrapped privacy filter to native user, repository, and
  session memory while preserving repository handoff continuity.

## [0.4.0] - 2026-08-04

### Removed

- Removed the `configure-workspace-capabilities` skill, prompt, deterministic
  runtime command, repository profile, and workspace capability report plane.

### Changed

- Installation now keeps every user-selected constellation plugin enabled at
  user scope. Alex ACT no longer manages per-workspace plugin activation.

## [0.3.3] - 2026-08-04

### Fixed

- Reported the verified Copilot CLI 1.0.78 scope boundary: repository
  `enabledPlugins: true` does not override user `false`, and direct-installed
  plugins ignore the bare false key. Workspace-only CLI loading now points to
  explicit `--plugin-dir` arguments while VS Code keeps its separate Agent
  Plugins and MCP reconciliation path.

## [0.3.2] - 2026-08-04

### Fixed

- Kept only Manager and Core enabled at user scope during constellation setup;
  installed optional plugins now remain disabled globally until a separately
  consented workspace capability profile activates them.

## [0.3.1] - 2026-08-04

### Fixed

- Synchronized the corrected greeting dimension wording with Core's bootstrap
  source.

## [0.3.0] - 2026-08-04

### Added

- Added preview-first workspace capability profiles that always pin Manager and
  Core enabled while allowing explicit repository defaults for optional plugins.
- Added private/internal identifier acknowledgement, atomic deep-merge apply,
  idempotency checks, and supported VS Code plugin/MCP reconciliation guidance.

## [0.2.2] - 2026-08-03

### Security

- Changed the private MSFT direct-install and metadata source to
  `fabioc_microsoft/alex-act-msft`, owned by a Microsoft enterprise-managed
  account.
- Required the active GitHub CLI identity to read the managed repository
  before MSFT installation; external personal-account fallback now fails
  closed.

## [0.2.1] - 2026-08-03

### Fixed

- Disabled VS Code's automatic next-change reveal in the managed user baseline
  so resolving a chat edit does not unexpectedly open another changed file.

## [0.2.0] - 2026-08-03

### Added

- Added preview-first user baseline merging and workspace CSS refresh, with
  deep object merges, comment-rich JSONC fail-closed handling, and separate
  consent/reporting for user settings, instructions, and workspace files.

## [0.1.1] - 2026-08-03

### Fixed

- Kept Agent Skills enabled while disabling VS Code's experimental generic
  skill resolver, which cannot invoke plugin-contributed skills in VS Code
  1.131 (`microsoft/vscode#314772`).

## [0.1.0] - 2026-08-03

### Added

- Local `alex-act-manager` plugin scaffold.
- Five lifecycle skills and seven namespaced commands ported from
  `Alex_ACT_Core` commit `47ef71ccab23b5e43a0170cb0449708c5f91629b`.
- Seventeen byte-identical Core instruction bootstrap resources.
- Manager-owned deterministic runtime, VS Code baseline, and Markdown preview
  CSS.
- Contract tests for inventory, namespace, bootstrap parity, workspace preview,
  and exact marketplace version resolution.

### Changed

- Rehomed user-facing lifecycle commands under `/alex-act-manager`.
- Replaced hidden Core CSS and VS Code baseline paths with Manager-owned skill
  resources.

### Distribution

- Published through the Alex ACT Mall as `alex-act-manager@alex-mall`.
- Core lifecycle removal remains a separate compatibility release.
