# Ticket #27: video completion and repeating gameplay showcases

Validated on 2026-10-11 against starting main commit `9f8c8795a12b2a9d2754f768b0fb9d6fd503ae4a`.

## Scope decision

The owner explicitly chose to restore ticket #27's five-second fully displayed photo dwell, Pause/Resume controls, captions and external YouTube links for Regulus the Advent and Father, Son & Holy Guns. This supersedes ticket #45's simplified interface for those two gameplay showcases. Image-only placeholder showcases retain their 6.5-second dwell and existing interface. Existing evidence inspection remains integrated; no new modal, framework or deployment was introduced.

## Behavior and verification

| Requirement | Evidence |
| --- | --- |
| Video → three photos → Video, muted playback requests on each video visit | Controlled provider check runs both complete sequences through the rendered production portfolio, with five-second fully displayed dwell and a fresh player per video visit. |
| Genuine YouTube completion | Both actual privacy-enhanced embeds delivered natural ended events after seeking near their respective ends using official player methods. Eligible completion selected the first photo. See [live provider results](live-youtube.json). |
| Paused, incomplete, blocked, failed or unavailable video remains selected | Real player Pause stayed selected in both embeds. Controlled provider states cover playing, paused, buffering, unstarted and cued, error/autoplay-blocked callbacks, and an aborted API request; virtual time never skips video. |
| Deferred completion and replay | Real completion during explicit Pause stayed selected; real replay from the beginning remained selected after Resume; later completion advanced. Controlled checks also cover hover, keyboard focus, hidden/offscreen state, active touch including cancellation, combined reasons and replay preceding its state callback. |
| Manual override, identity and cleanup | Rendered checks preserve player identity during active reselection and strip browsing; manual selection cancels pending completion. Old callbacks and ended events emitted by destroy cannot advance; route return restores video-first defaults. |
| Reduced motion and independence | Controlled checks cover initial Pause, explicit Resume, immediate photo changes and five-second dwell. Each gallery's player, photo timer and visitor Pause are independent. Placeholder regression coverage retains its original behavior. |
| Existing content and responsive behavior | Complete portfolio suite checks photos/fades/loading/Retry, image inspection, gameplay preview strip interactions, empty/single/long fixtures, report interactions, store links and responsive viewports. Final result recorded below. |

The controlled provider is substituted at the external API boundary, leaving application selection, inspection, timers, fades and accessibility in the production page. It does not certify YouTube availability. The live check performs real playback and observes the real events; it does not guarantee autoplay for every visitor, browser or provider condition. Hidden-tab checks use controlled document visibility; browser viewport/touch coverage is not physical-device certification. Original report screenshot-path data remains empty; synthetic overlay verification is separate from real capture certification.

## Commands and results

- `npm run build`: passed TypeScript and production build.
- `npm run check:preview`: 65/65 passed.
- `npm run check:runner`: 90/90 passed.
- `node scripts/browser/check-youtube-live.mjs`: both actual embeds passed deferred natural completion, replay retention and eligible completion advancement.
- Additional actual-player Pause probe: both embeds retained video selection while the provider player was paused. Its results are included in `live-youtube.json`.
- `npm run check:browser`: all 11 checks passed on final implementation/test commit `c12a46f38cc17368fe3c30cb4a47664d09695b02`. See [complete suite summary](browser-summary.json), including stable input fingerprint `4031e9e7703a1b7ba99ea2d5b7a09f54f36cf89c5fe4abd8f073df34c09032a5`. Only documentation/evidence was pending during this run; subsequent changes record these results.

A prior focused slideshow attempt passed its assertions but was marked obsolete because caption styling changed during the run. It is excluded from final passing evidence. The complete suite checks the final, stable inputs.

The original caption-free spacing assertion was updated to verify the restored caption/control row and 44px actions; the focused gameplay preview check passed all ten viewports in both motion modes. Complete-suite attempts also exposed a native-touch placeholder-test failure: Chromium sometimes delivered pointer/touch events but no compatibility click on the first tap after a canceled vertical pan. Document-capture instrumentation in a four-second rendered reproduction confirmed the missing click. Longer quiet intervals and a longer touch hold did not reliably fix it. Explicitly ending native scroll on a verified noninteractive gutter before the separate image activation passed six consecutive reproduction trials. The existing check now includes that preparation and still requires one image tap to open the real dialog; production gesture handling is unchanged. Superseded failed/interrupted runs are excluded from final passing evidence.

## Independent review

Two GPT-6.1 Sol agents at high effort reviewed `git diff 9f8c8795a12b2a9d2754f768b0fb9d6fd503ae4a...HEAD` separately.

- **Standards:** no remaining documented violations, baseline smells or concrete correctness/lifecycle defects. The initial nonblocking naming suggestion was resolved by renaming the slideshow option to `videoShowcase` in `182fc58`; the reviewer rechecked the delta. The stale validation description was updated.
- **Spec:** no actionable missing requirements, scope creep or incorrect behavior. Both reviewers also rechecked the responsive, native-touch preparation and keyboard-test changes. The final complete rendered suite passed.

The keyboard regression check now exercises the restored Pause/Resume tab stop with Enter before continuing the existing preview-strip traversal. This updates the former caption-free focus-order expectation and preserves its visible-focus and modal-return assertions.

## Visual inspection

Complete main-photo framing, captions, counters, 44px Pause/Resume actions and preview strip fit were inspected in both captures:

- [Regulus at 390px](regulus-phone.png)
- [Father, Son & Holy Guns at desktop width](father-son-desktop.png)

Final owner acceptance follows implementation and PR review.
