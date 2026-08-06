# Alex ACT Manager

![Alex ACT Manager](https://raw.githubusercontent.com/fabioc-aloha/Alex_ACT_Manager/main/assets/banner.svg)

[Core](https://github.com/fabioc-aloha/Alex_ACT_Core) · [Manager](https://github.com/fabioc-aloha/Alex_ACT_Manager) · [Illustrator](https://github.com/fabioc-aloha/Alex_ACT_Illustrator_Plugin) · [Document Tools](https://github.com/fabioc-aloha/Alex_ACT_Document_Tools) · [Enterprise](https://github.com/fabioc-aloha/alex-act-enterprise)

Alex ACT Manager keeps lifecycle work out of the reasoning runtime. Setup, repair, updates, verification, and removal remain reversible and inspectable while Core stays focused on the work users invoke every day.

## Status

**Released as `v1.0.0`.** The bootstrap carries 16 files and Shared Memory
routing is removed. Source:
[`fabioc-aloha/Alex_ACT_Manager`](https://github.com/fabioc-aloha/Alex_ACT_Manager).
Install from the Alex ACT Mall as `alex-act-manager@alex-mall`.

Manager and Core remain the mandatory brain spine. Every optional plugin the
user selects is installed and enabled at user scope across workspaces.

Approved Core source no longer declares Manager's five lifecycle skill names.
Core retains only seven thin namespaced command redirects until the
compatibility window closes. Published Core 0.9.0 still carries the old skill
copies until its separately gated release and Mall refresh.

## Install

```powershell
copilot plugin marketplace add fabioc-aloha/Alex_Skill_Mall
copilot plugin install alex-act-manager@alex-mall
```

Reload the host or start a new Agent chat, then use a namespaced command such
as `/alex-act-manager plugin-status`.

## Why Manager Exists

Core reached this constellation's own 100-file packaging convention while
combining frequent reasoning with infrequent lifecycle work. Manager separates
those concerns without becoming a second brain.

The 100-file figure is a convention we set for ourselves, not a platform limit:
no install-time check enforces it, and a 133-file install succeeded on Copilot
CLI 1.0.78. The split still earns its keep on maintenance grounds, because
lifecycle work changes on a different cadence than reasoning.

| Core keeps | Manager owns |
| --- | --- |
| Alex Finch identity and ACT reasoning | Constellation installation and repair |
| Safety, native-memory privacy, communication, and repository handoffs | Exact version resolution and status |
| Frequent reasoning and engineering skills | Plugin update and uninstall |
| Drift signals and a compact Manager route | Core instruction bootstrap |
| Canonical source instructions | VS Code and repository workspace setup |

## What Ships

| Skill | Responsibility |
| --- | --- |
| `install-constellation` | Install selected constellation plugins and bootstrap Core instructions |
| `plugin-management` | Shared CLI, scope, settings, version, and receipt rules |
| `update-plugins` | Preview and apply consented updates |
| `uninstall-constellation` | Preview and perform clean removal |
| `bootstrap-workspace` | Provision repository-scoped VS Code files |

Seven namespaced commands expose those skills plus user-scope VS Code apply and
verify flows. `manager-operations.cjs` provides deterministic marketplace and
workspace behavior.

## Core-Owned Bootstrap

Approved Manager source bundles 16 instruction resources copied byte-for-byte
from current `Alex_ACT_Core` source. Core remains their authority. Manager
packages and installs them; it does not fork their content. The test suite fails
if a local Core checkout exposes drift. Manager v1.0.0 ships the 16-file
contract; installed receipts refresh on the next plugin update and bootstrap
repair.

## Development

```powershell
npm test
```

The contract verifies component inventory, Core bootstrap parity, Manager
command namespaces, payload capacity, empty-state workspace preview, immutable
brain-spine guards, optional capability deep merges, private-identifier gates,
and exact marketplace version resolution.

## Current Boundary

Manager is the sole lifecycle skill owner in approved source. Lock-safe external
update scripts, atomic receipts, feature-delta reporting, and capability intent
indexing remain planned enhancements. Their absence is not hidden by the source
extraction.

## Governance

`Alex_ACT_Steward` owns architecture, approval, release coordination, and
cross-repository coherence. This release does not authorize user-scope mutation
or Core lifecycle removal without the normal consent and compatibility gates.

## Would Revise If

Revisit by **2026-11-05** or sooner if Manager cannot install Core from an empty
state, bootstrap resources repeatedly drift from Core, a clean session resolves
a lifecycle skill to Core, or separating lifecycle work creates more operator
ambiguity than the duplicated design.
