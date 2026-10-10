# Sandcastle setup validation — issue #48

Date: 10 October 2026. Base: `18aa1ed` (current origin/main after PR #42 merged).

Passed:
- `npm run check:sandcastle`: runner type check and 8 policy tests.
- Live dry-runs reject #27 and #43's explicit holds and accept setup issue #48.
- Dispatch of an eligible issue without `--approve` exits before agent startup.
- `npm run build`.
- `npm run check:overlays`: 5 tests; unavailable real screenshot paths explicitly skipped.
- `npm run check:preview`: 29 tests.
- `npm run check:runner`: 38 tests, with the Sandcastle type check and 8 policy
  tests invoked by its npm precheck hook (also used by existing CI).
- `npm run check:browser`: complete suite passed on stable inputs, including gameplay,
  evidence modals/interactions, synthetic overlay fixture, and all six report layouts.
- Site source, browser-check source, and original evidence have no setup diff.

The initial old-main run failed a slideshow assertion. Updating to the newly merged
PR #42 fixed the baseline. A later run was invalidated when generated report line
endings were restored during execution. The recorded complete pass comes from the
subsequent rebuilt run with inputs held steady.

Runtime:
- Docker Desktop 4.94.0 installed per user.
- WSL 3.0.1 and Windows WSL/Virtual Machine Platform prerequisites installed.
- Windows reported a required restart; no restart was initiated.
- Doctor confirms Git, owner-authenticated GitHub CLI, existing ChatGPT login cache,
  credential ignore rules, and project-local skills.
- Linux Docker engine/image readiness remain pending restart and Docker startup.
- Image build and authenticated sandbox smoke run have not been verified.
- No feature agent ran, no implementation hold was released, and no deployment occurred.

Keep issue #48 open until container build/smoke verification is complete.
