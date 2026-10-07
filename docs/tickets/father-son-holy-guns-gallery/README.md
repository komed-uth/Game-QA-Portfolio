# Father, Son & Holy Guns gallery ticket breakdown

Status: Approved by the user. These tickets are prepared locally; tracker publication is pending configuration.

Source: [Implementation specification](../../specs/father-son-holy-guns-gallery.md).

## Approved sequence

1. [Reuse Regulus's gallery with existing behavior intact](01-reuse-regulus-gallery.md). Blocked by: none. Delivers a reusable gallery and a verifiably unchanged Regulus showcase.
2. [Add the Father, Son & Holy Guns gameplay gallery](02-add-father-son-gallery.md). Blocked by: ticket 01. Delivers the complete four-slide gameplay showcase, including durable assets, navigation, playback, accessible descriptions, responsive presentation, documentation, and checks.

## Rationale

Ticket 01 is the narrow prefactoring prerequisite identified in the plan. Ticket 02 is a complete vertical feature slice: the supplied assets, presentation, interactions, and verification land together. Additional tickets for individual images, styling alone, or a separate verification phase would split a small feature across artificial boundaries.

The only blocking edge is 01 → 02. Asset copying and wording could be prepared earlier, but the complete second ticket cannot land against the shared gallery until the first ticket is complete. Each ticket is scoped to one fresh implementation context and is independently verifiable when complete.

## Approval

The user approved the two-ticket breakdown, its granularity, and the 01 → 02 blocking edge. No further confirmation of the breakdown is required. Preserve this approval when publishing the tickets.

## Publication

Breakdown approval is complete. Tracker and triage-label configuration are still missing; run `/setup-matt-pocock-skills` to establish them.

After configuration, publish one ticket at a time in dependency order with the configured ready-for-agent label. Use native blocking relationships when the tracker supports them; otherwise record the blocking issue reference. If local markdown is selected, use the skill's one-file-per-ticket tracker format.

Do not close or modify a parent issue. The source specification is currently local and no parent tracker issue exists.

No website implementation or tracker mutation has been performed by this ticket-drafting task.
