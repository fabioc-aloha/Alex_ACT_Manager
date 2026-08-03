# Alex ACT Manager

This repository is the source for the optional `alex-act-manager` lifecycle
plugin. It owns setup, repair, status, update, uninstall, VS Code configuration,
and repository workspace bootstrap. It does not own Alex Finch runtime identity,
ACT reasoning, document conversion, visual authoring, or repository brain
migration.

## Ownership

- `Alex_ACT_Core` owns runtime identity, ACT reasoning, and the 17 source
  instructions Manager packages for bootstrap.
- This repository owns lifecycle skills, commands, deterministic scripts, and
  configuration resources.
- `Alex_ACT_Steward` owns architecture, approval, and release coordination.

## Rules

1. Preview every mutating lifecycle operation before asking for consent.
2. Fail closed when version authority or install source is ambiguous.
3. Never alter the 17 bootstrap resources independently of Core; regenerate and
   verify them from an immutable Core source.
4. Keep Manager commands under the `/alex-act-manager` namespace.
5. Keep skill resources inside declared skill roots so Mall packaging preserves
   them without hidden include mappings.
6. Never add editorial README files beneath skill or command roots.
7. Run `npm test` after every lifecycle or packaging change.
8. Do not release, publish, install, or mutate user scope without separate
   approval.

## Current Limit

The scaffold preserves current Core lifecycle behavior. Planned lock-safe update
scripts, atomic receipts, feature-delta reporting, and intent indexing require
their own tests and approval before implementation.
