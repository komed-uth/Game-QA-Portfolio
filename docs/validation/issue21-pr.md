## Summary

Complete image-modal interactions for #21 using the existing shared evidence viewer.

```diff
 on gallery drag
-  suppress opening only after horizontal completion
+  suppress pointer clicks once dragging begins
+  preserve keyboard activation after touch cancellation

 rendered image checks
+  both projects and PIX across ten responsive viewports
+  vertical mouse dragging and touch-scroll-to-keyboard activation
```

## Evidence

- **Before:** Vertical drags could open an image; preserving suppression after touch cancellation swallowed the first keyboard Enter.
  **After:** Rendered regressions require no modal during dragging/scrolling and immediate keyboard opening afterward.
- TypeScript and production build passed. Preview checks passed (2/2). Final rendered-page run passed, including real touch scrolling followed by keyboard activation and ten responsive viewports.
- Independent Sol 6.1 high-effort Standards and Spec reviews: 0 unresolved findings after the keyboard fix. Phone portrait and landscape screenshots visually inspected.
- Validation: [ticket #21 evidence](issue21.md).

## Merge Danger

**Door:** two-way

Revert the gallery click guard and browser-check extensions to roll back.

**Blast Radius:** gallery

The gesture guard is shared by both gameplay showcases. Checks cover pointer and keyboard opening, selection, navigation, responsive fit, and neighboring reports. No evidence assets or deployment change.