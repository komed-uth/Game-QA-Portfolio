import { useEffect, useRef, useState } from "react";

// Inspection reasons are independent: clearing one must not clear another.
export default function useGallerySlideshow({ selected, ready, count, inspecting, advance }: {
  selected: number;
  ready: boolean;
  count: number;
  inspecting: boolean;
  advance: () => void;
}) {
  const gallery = useRef<HTMLDivElement>(null);
  const [paused, setPaused] = useState(() => window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  const [inspection, setInspection] = useState({ hover: false, focus: false, dragging: false, visible: false, hidden: document.hidden });
  const advanceRef = useRef(advance);
  advanceRef.current = advance;

  useEffect(() => {
    const element = gallery.current;
    if (!element) return;
    let pointer: number | null = null;
    let pointerFocus = false;
    let focusCheck: ReturnType<typeof setTimeout> | undefined;
    const update = (reason: keyof typeof inspection, value: boolean) =>
      setInspection(current => current[reason] === value ? current : { ...current, [reason]: value });
    // Pointer clicks retain DOM focus after hover ends. Only keyboard-visible
    // focus is inspection; switching back to keyboard must reconcile it too.
    const focus = () => update("focus", element.contains(document.activeElement) && !pointerFocus && !!document.activeElement?.matches(":focus-visible"));
    const deferFocus = () => { clearTimeout(focusCheck); focusCheck = setTimeout(focus, 0); };
    const keyboard = () => { pointerFocus = false; deferFocus(); };
    const enter = (event: globalThis.PointerEvent) => { if (event.pointerType !== "touch") update("hover", true); };
    const leave = () => update("hover", false);
    const down = (event: globalThis.PointerEvent) => {
      if (!event.isPrimary || event.button !== 0) return;
      // Clicking an already keyboard-focused control may retain :focus-visible.
      pointerFocus = true;
      deferFocus();
      pointer = event.pointerId;
      update("dragging", true);
    };
    const up = (event: globalThis.PointerEvent) => {
      if (pointer !== event.pointerId) return;
      pointer = null;
      update("dragging", false);
    };
    // Native touch scrolling cancels pointer delivery before the finger lifts.
    const cancelPointer = (event: globalThis.PointerEvent) => {
      if (event.pointerType !== "touch") up(event);
    };
    const endTouch = (event: TouchEvent) => {
      if (event.touches.length) return;
      pointer = null;
      update("dragging", false);
    };
    const blur = () => {
      pointer = null;
      update("dragging", false);
      deferFocus(); // Includes focus transferred into a cross-origin video iframe.
    };
    const visibility = () => update("hidden", document.hidden);
    const observer = new IntersectionObserver(entries => update("visible", entries[0].isIntersecting));
    observer.observe(element);
    focus();
    element.addEventListener("pointerenter", enter);
    element.addEventListener("pointerleave", leave);
    element.addEventListener("pointerdown", down, true);
    element.addEventListener("focusin", focus);
    element.addEventListener("focusout", deferFocus);
    window.addEventListener("pointerup", up, true);
    window.addEventListener("pointercancel", cancelPointer, true);
    window.addEventListener("touchend", endTouch, true);
    window.addEventListener("touchcancel", endTouch, true);
    window.addEventListener("blur", blur);
    window.addEventListener("focus", focus);
    document.addEventListener("visibilitychange", visibility);
    document.addEventListener("keydown", keyboard, true);
    return () => {
      clearTimeout(focusCheck);
      observer.disconnect();
      element.removeEventListener("pointerenter", enter);
      element.removeEventListener("pointerleave", leave);
      element.removeEventListener("pointerdown", down, true);
      element.removeEventListener("focusin", focus);
      element.removeEventListener("focusout", deferFocus);
      window.removeEventListener("pointerup", up, true);
      window.removeEventListener("pointercancel", cancelPointer, true);
      window.removeEventListener("touchend", endTouch, true);
      window.removeEventListener("touchcancel", endTouch, true);
      window.removeEventListener("blur", blur);
      window.removeEventListener("focus", focus);
      document.removeEventListener("visibilitychange", visibility);
      document.removeEventListener("keydown", keyboard, true);
    };
  }, []);

  // Native dialogs can disappear without a pointerleave on their ancestor.
  // Reconcile hover when inspection changes so closing outside cannot latch it.
  useEffect(() => {
    const hover = !!gallery.current?.matches(":hover") && window.matchMedia("(any-hover: hover)").matches;
    setInspection(current => current.hover === hover ? current : { ...current, hover });
  }, [inspecting]);
  const suspended = inspecting || inspection.hover || inspection.focus || inspection.dragging || !inspection.visible || inspection.hidden;
  useEffect(() => {
    if (count < 2 || !ready || paused || suspended) return;
    const timer = setTimeout(() => advanceRef.current(), 2500);
    return () => clearTimeout(timer);
  }, [selected, ready, count, paused, suspended]);

  return { gallery, paused, toggle: () => setPaused(value => !value) };
}
