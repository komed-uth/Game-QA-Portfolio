import { useEffect, useRef, useState } from "react";

type PhotoLayer = { source: string; request: number; animate: boolean };
type PhotoState = {
  source: string | null;
  phase: "ready" | "loading" | "failed" | "fading-in";
  layers: PhotoLayer[];
};

// Selection owns announcements; retained layers own the visible presentation.
// A request may finish only after decode and its own CSS completion.
export default function useGalleryPhoto(source: string | null) {
  const [photo, setPhoto] = useState<PhotoState>({ source: null, phase: "ready", layers: [] });
  const request = useRef(0);
  const finishFade = useRef<(id: number) => void>(() => {});
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const id = ++request.current;
    let cancelled = false;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const image = new Image();
    const complete = () => {
      if (cancelled) return;
      setPhoto(current => {
        const layer = current.layers.find(entry => entry.request === id);
        return layer ? { source, phase: "ready", layers: [{ ...layer, animate: false }] } : current;
      });
    };
    finishFade.current = ended => { if (ended === id) complete(); };

    if (!source) {
      setPhoto({ source: null, phase: "ready", layers: [] });
    } else {
      setPhoto(current => ({ ...current, phase: "loading" }));
      const fail = () => {
        if (!cancelled) setPhoto(current => ({ ...current, phase: "failed" }));
      };
      image.onload = async () => {
        try { await image.decode(); } catch { fail(); return; }
        if (cancelled) return;
        setPhoto(current => {
          const animate = current.layers.length > 0 && !reducedMotion.matches;
          const layer = { source, request: id, animate };
          return { source, phase: animate ? "fading-in" : "ready",
            layers: animate ? [...current.layers, layer] : [layer] };
        });
      };
      image.onerror = fail;
      image.src = source;
    }

    function finishMotion() {
      if (reducedMotion.matches) complete();
    }
    reducedMotion.addEventListener("change", finishMotion);
    return () => {
      cancelled = true;
      image.onload = null;
      image.onerror = null;
      reducedMotion.removeEventListener("change", finishMotion);
    };
  }, [source, attempt]);

  return { ...photo, retry: () => setAttempt(value => value + 1),
    finishFade: (id: number) => finishFade.current(id) };
}
