## Summary

Project evidence opens in a shared accessible modal, keeping visitors in the portfolio. Report controls retain their order and six choices; a compact report preview opens the interactive report and remembers its inspection position.

```text
MediaGallery / PIX capture / ReportViewer
  -> EvidenceModal
     -> fitted screenshot or internally scrolling report
     -> dismiss, restore focus and portfolio position
```

Implements #20 and its image/report requirements.

## Evidence

- **Before:** Images opened separate tabs; full reports occupied the inline report viewport.
  **After:** Seven images and six reports pass rendered-page opening, selection, navigation, original-link and independent report-position checks.
- **Before:** Browser checks exposed focus wrapping/restoration and report-position lifecycle issues; review exposed caption tap sizing and exit animation restart issues.
  **After:** Corrected behavior passes dismissal (including iframe Escape), keyboard containment/restoration, 44px gallery actions, background lock, timed exit and reduced motion checks.
- TypeScript and production build pass. Ten desktop/phone/tablet/breakpoint viewports pass margin and overflow checks. Five report toggles, chart rendering and inline videos rechecked.
- Detailed checks and limits: [validation record](issue20.md).

## Merge Danger

**Door:** two-way

UI-only change; revert the implementation commits to restore inline inspection. Original evidence, videos and store links are preserved.

**Blast Radius:** portfolio

Touches shared gameplay galleries, the PIX capture and performance report inspection. Report iframe keyboard integration assumes the current same-origin reports. Browser checks used Edge; report-owned external high-resolution images were not available for end-to-end overlay validation.
