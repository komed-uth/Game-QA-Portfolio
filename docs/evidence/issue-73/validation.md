# Ticket #73: remove gameplay preview strip arrows

Implemented [#73](https://github.com/komed-uth/Game-QA-Portfolio/issues/73) against [specification #72](https://github.com/komed-uth/Game-QA-Portfolio/issues/72), starting from synchronized main `6bb08cbed1083e661c7cd65147185412d2d3f71e` on 2026-10-12.

## Result

The shared gameplay preview strip ends after its thumbnails and native scrollbar. Its two circular browsing buttons, control row, row spacing, endpoint state, endpoint observer and group-browsing handler are removed. All five current galleries and future consumers inherit the presentation. Thumbnail sizing, selection and focus reveal, mouse dragging, native touch panning and horizontal wheel browsing retain their existing implementation.

The `.gallery-arrow` action styling remains because failed-photo Retry and Pause/Resume slideshow buttons also use it. Main-photo swipes, enlarged-image navigation, loading, transitions, progression timing, video integration, content, media ordering, reports and the PIX capture retain their production source.

## Acceptance evidence

| Requirement | Rendered evidence |
| --- | --- |
| All five strips have no arrows, hidden replacements or reserved row gap | Shared layout checks count only thumbnail actions, reject even hidden preview-arrow buttons, measure the gallery ending at the scrollbar, and check its green thumb styling. Regulus and Father Son run at ten viewports; the three placeholder galleries run at eleven, in normal and reduced motion. |
| Fitting, overflowing and longer lists remain usable | Existing empty/single/16-item fixtures and real galleries check fit, finite wheel endpoints, scrollbar dragging, mouse dragging and native touch. Longer lists reach both ends through each browsing method. Vertical touch still scrolls the page. |
| Browsing and activation remain separate | Browsing retains selected media and active player identity; drag and touch never open inspection. Existing activation, selected borders, accessible names and pressed states remain checked. |
| Keyboard, reveal and resizing | Left/Right, Home/End, Enter/Space, visible focus, focus/selection reveal and resize retention remain covered. Tab leaves the final thumbnail immediately without removed-control focus stops. |
| Inspection and media behavior | Existing image opening, enlarged-image previous/next and keyboard navigation, synchronization, dismissal, focus restoration, main-photo swipes, fades, failure recovery, slideshow, video and reduced-motion checks remain. Retry additionally retains a target of at least 44px and its circular green presentation. |
| Independent state and neighboring evidence | All five gallery selections, inspection and progression remain independent. Existing report and PIX-capture regression checks are retained. No original assets, media lists, project details or report contents are changed. |

## Commands and results

- `npm run check:workstation`: passed in approved execution; authenticated account `komed-uth`.
- `npm run build`: passed TypeScript and production build.
- `npm run check:preview`: 65/65 passed.
- `npm run check:overlays`: 5/5 parser tests passed; existing real-capture data skips are recorded below.
- `npm run check:browser`: all 11 checks passed with stable inputs. See [retained full-suite summary](browser-summary.json), including fingerprint `c62a79b58621fa8323ef73bb5e6182d7b24a0cd7217ca8aa2479d94b50cd2e22`.
- Focused rendered fixture recheck after the test-only boundary-predicate extraction: passed in 57.02 seconds. See [fixture summary](fixture-summary.json), recorded against commit `4fd1b564f7f2dc97db341585ac93a684992c8522`.

The full browser run started with the ticket changes uncommitted on the starting main commit. Commit `7ef674f` records those same inputs during the run; committing did not alter the source, build or checks. The runner independently verified that all validation inputs remained stable. Subsequent commit `4fd1b56` only shares an identical test boundary predicate and was rechecked through the complete media-list fixture. `git diff --name-only 7ef674f HEAD -- src public package.json package-lock.json` is empty: production inputs and the tested build are unchanged. Later additions record documentation and evidence.

## Independent review

Two Sol 6.1 agents at high effort reviewed the fixed diff from starting main through `7ef674f`.

- Standards: no remaining findings. The initial optional duplicated-boundary-predicate cleanup was resolved in `4fd1b56`; the reviewer confirmed that the helper preserves the logic and tolerance.
- Spec: no remaining findings against #73 and #72. The reviewer rechecked `4fd1b56` and confirmed unchanged predicates, direction mapping, coverage and production behavior.

## Visual evidence

- [Before: existing Regulus phone capture](../issue-27/regulus-phone.png)
- [After: Regulus phone](regulus-phone.png)
- [After: Father, Son & Holy Guns desktop](father-son-desktop.png)
- [After: MeowMoney phone](meowmoney-phone.png)

Captures retain original image framing, the selected thumbnail border and the compact end of the gallery. Fitting desktop previews retain their existing scrollbar visibility behavior.

## Limits and risk

The five supplied original HTML reports have empty screenshot path lists. Synthetic overlays check integration; they do not certify real capture images. Headless viewport and native-touch simulations are not physical-device certification, and controlled YouTube checks do not certify provider availability for every visitor.

The change is reversible presentation and button-exclusive cleanup in the shared gallery. It changes no schema, storage or media data. Unrelated work in the original checkout was preserved by using a clean worktree.
