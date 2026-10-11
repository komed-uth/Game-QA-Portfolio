import { useEffect, useRef, useState } from "react";

type Player = {
  mute: () => void;
  playVideo: () => void;
  getPlayerState: () => number;
  destroy: () => void;
};
type PlayerEvent = { target: Player; data: number };
type YouTubeAPI = {
  Player: new (iframe: HTMLIFrameElement, options: { events: {
    onReady: (event: PlayerEvent) => void;
    onStateChange: (event: PlayerEvent) => void;
    onError: () => void;
    onAutoplayBlocked: () => void;
  } }) => Player;
};
declare global {
  interface Window {
    YT?: YouTubeAPI;
    onYouTubeIframeAPIReady?: () => void;
  }
}

let api: Promise<YouTubeAPI> | undefined;
function loadAPI() {
  if (window.YT?.Player) return Promise.resolve(window.YT);
  if (!api) api = new Promise<YouTubeAPI>((resolve, reject) => {
    const previous = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      try { previous?.(); } finally {
        if (window.YT?.Player) resolve(window.YT);
        else reject(new Error("YouTube API unavailable"));
      }
    };
    const script = document.createElement("script");
    script.src = "https://www.youtube.com/iframe_api";
    script.onerror = () => reject(new Error("YouTube API unavailable"));
    document.head.append(script);
  });
  return api;
}

// A mounted player owns one video visit. Eligibility changes never recreate it.
export default function YouTubeVideo({ videoId, title, eligible, isCurrent, onComplete }: {
  videoId: string;
  title: string;
  eligible: boolean;
  isCurrent: () => boolean;
  onComplete: () => void;
}) {
  const iframe = useRef<HTMLIFrameElement>(null);
  const player = useRef<Player>();
  const ended = useRef(false);
  const [completion, setCompletion] = useState(0);
  const current = useRef({ isCurrent, onComplete });
  current.current = { isCurrent, onComplete };

  useEffect(() => {
    let live = true;
    const active = () => live && current.current.isCurrent();
    void loadAPI().then(YT => {
      if (!active() || !iframe.current) return;
      player.current = new YT.Player(iframe.current, { events: {
        onReady: event => {
          if (!active()) return;
          event.target.mute();
          event.target.playVideo();
        },
        onStateChange: event => {
          if (!active()) return;
          ended.current = event.data === 0;
          setCompletion(value => value + 1);
        },
        onError: () => { if (active()) ended.current = false; },
        onAutoplayBlocked: () => { if (active()) ended.current = false; },
      } });
    }).catch(() => { /* Provider failure leaves manual playback/selection available. */ });
    return () => {
      live = false; // Invalidate before destroy, which can itself emit state events.
      ended.current = false;
      const replaced = player.current;
      player.current = undefined;
      replaced?.destroy();
    };
  }, [videoId]);

  useEffect(() => {
    if (!eligible || !ended.current || !current.current.isCurrent()) return;
    // Replay may have started before its state callback reaches the page.
    if (player.current?.getPlayerState() !== 0) { ended.current = false; return; }
    ended.current = false;
    current.current.onComplete();
  }, [eligible, completion]);

  return <div className="gallery-video-player"><iframe ref={iframe}
    src={"https://www.youtube-nocookie.com/embed/" + videoId +
      "?autoplay=1&mute=1&playsinline=1&rel=0&enablejsapi=1&origin=" + encodeURIComponent(window.location.origin)}
    title={title} allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture; web-share"
    allowFullScreen /></div>;
}
