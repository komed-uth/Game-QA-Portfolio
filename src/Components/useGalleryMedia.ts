import { useEffect, useRef, useState } from "react";

export type VideoReadiness = "usable" | "playing" | "blocked" | "failed";
type Layer = { source: string; type: "image" | "video"; request: number; animate: boolean; presented: boolean };
type Presentation = {
  request: number;
  phase: "ready" | "loading" | "failed" | "fading-in";
  layers: Layer[];
};

// Selection owns announcements; retained layers own only the visible presentation.
// Every readiness result, deadline and CSS completion belongs to one request.
export default function useGalleryMedia(source: string | null, type: "image" | "video" | undefined) {
  const [media, setMedia] = useState<Presentation>({ request: 0, phase: "loading", layers: [] });
  const request = useRef(0);
  const finishFade = useRef<(id: number) => void>(() => {});
  const videoEvent = useRef<(id: number, event: VideoReadiness) => void>(() => {});
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const id = ++request.current;
    let cancelled = false;
    let usable = false;
    let blocked = false;
    let resolved = false;
    let deadline: ReturnType<typeof setTimeout> | undefined;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const image = new Image();
    const complete = () => {
      if (cancelled) return;
      setMedia(current => {
        const layer = current.layers.find(entry => entry.request === id && entry.presented);
        return layer ? { request: id, phase: "ready", layers: [{ ...layer, animate: false }] } : current;
      });
    };
    const present = () => {
      if (cancelled || resolved || !source || !type) return;
      resolved = true;
      clearTimeout(deadline);
      setMedia(current => {
        const backdrops = current.layers.filter(layer => layer.presented);
        const animate = backdrops.length > 0 && !reducedMotion.matches;
        const layer = { source, type, request: id, animate, presented: true };
        return { request: id, phase: animate ? "fading-in" : "ready",
          layers: animate ? [...backdrops, layer] : [layer] };
      });
    };
    const fail = (playerError = false) => {
      if (cancelled || (resolved && !playerError)) return;
      resolved = true;
      clearTimeout(deadline);
      setMedia(current => ({ ...current, phase: "failed", layers: current.layers.filter(layer => layer.presented && (!playerError || layer.request !== id)) }));
    };
    finishFade.current = ended => { if (ended === id) complete(); };
    videoEvent.current = (eventId, event) => {
      if (cancelled || eventId !== id) return;
      if (event === "usable") usable = true;
      if (event === "blocked") blocked = true;
      if (event === "playing" || (blocked && usable)) present();
      if (event === "failed") fail(true);
    };
    setMedia(current => ({ request: id, phase: "loading",
      layers: [...current.layers.filter(layer => layer.presented),
        ...(source && type === "video" ? [{ source, type, request: id, animate: false, presented: false }] : [])] }));
    if (source && type === "video") {
      deadline = setTimeout(() => { if (usable) present(); else fail(); }, 8000);
    } else if (source) {
      image.onload = async () => {
        try { await image.decode(); } catch { fail(); return; }
        present();
      };
      image.onerror = () => fail();
      image.src = source;
    }

    function finishMotion() { if (reducedMotion.matches) complete(); }
    reducedMotion.addEventListener("change", finishMotion);
    return () => {
      cancelled = true;
      clearTimeout(deadline);
      image.onload = null;
      image.onerror = null;
      reducedMotion.removeEventListener("change", finishMotion);
    };
  }, [source, type, attempt]);

  return { ...media, retry: () => setAttempt(value => value + 1),
    finishFade: (id: number) => finishFade.current(id),
    videoEvent: (id: number, event: VideoReadiness) => videoEvent.current(id, event) };
}
