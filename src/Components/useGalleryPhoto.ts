import { useEffect, useRef, useState } from "react";

type PhotoState = {
  source: string | null;
  phase: "ready" | "loading" | "failed" | "fading-out" | "fading-in";
};

// Selection owns the caption; this lifecycle owns only the displayed photo.
// Ready means loading and both fades have finished, for future photo dwell timing.
export default function useGalleryPhoto(source: string | null) {
  const [photo, setPhoto] = useState<PhotoState>({ source: null, phase: "ready" });
  const displayed = useRef<string | null>(null);
  const previousSource = useRef<string | null>(null);
  const finishFade = useRef<(name: string) => void>(() => {});
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const fadeIn = !!source && !!previousSource.current && !reducedMotion.matches;
    const fadeOut = fadeIn && !!displayed.current;
    previousSource.current = source;
    let outgoingFinished = !fadeOut;
    let loaded = false;
    let failed = false;
    let incomingStarted = false;
    const image = new Image();

    function present() {
      if (cancelled || !outgoingFinished || incomingStarted) return;
      if (failed) {
        displayed.current = null;
        setPhoto({ source: null, phase: "failed" });
      } else if (loaded) {
        incomingStarted = true;
        displayed.current = source;
        setPhoto({ source, phase: fadeIn && !reducedMotion.matches ? "fading-in" : "ready" });
      } else {
        displayed.current = null;
        setPhoto({ source: null, phase: "loading" });
      }
    }

    // CSS completion, rather than elapsed time since selection, marks a photo ready.
    finishFade.current = name => {
      if (cancelled) return;
      if (name === "gallery-photo-out") {
        outgoingFinished = true;
        present();
      } else if (name === "gallery-photo-in" && incomingStarted) {
        setPhoto({ source, phase: "ready" });
      }
    };

    if (!source) {
      displayed.current = null;
      setPhoto({ source: null, phase: "ready" });
    } else {
      setPhoto(fadeOut ? { source: displayed.current, phase: "fading-out" } : { source: null, phase: "loading" });
      image.onload = async () => {
        try {
          await image.decode();
          loaded = true;
        } catch {
          failed = true;
        }
        present();
      };
      image.onerror = () => { failed = true; present(); };
      image.src = source;
    }

    function finishMotion() {
      if (!reducedMotion.matches || cancelled) return;
      outgoingFinished = true;
      if (incomingStarted) setPhoto({ source, phase: "ready" });
      else if (source) present();
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
    finishFade: (name: string) => finishFade.current(name) };
}
